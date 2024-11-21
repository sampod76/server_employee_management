/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import httpStatus from 'http-status';
import mongoose, { PipelineStage, Schema, Types } from 'mongoose';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import { paginationHelper } from '../../../../helper/paginationHelper';
import ApiError from '../../../errors/ApiError';
import { IGenericResponse } from '../../../interface/common';
import { IPaginationOption } from '../../../interface/pagination';

import {
  ILookupCollection,
  LookupAnyRoleDetailsReusable,
  LookupReusable,
} from '../../../../helper/lookUpResuable';

import { produceUpdateGroupMemberListSortKafka } from '../../../kafka/producer.kafka';
import { ENUM_REDIS_KEY } from '../../../redis/consent.redis';
import { redisClient } from '../../../redis/redis';
import { findAllSocketsIdsFromUserId } from '../../../redis/service.redis';
import { redisSetter } from '../../../redis/utls.redis';

import { IUserRef, IUserRefAndDetails } from '../../allUser/typesAndConst';
import { validateUserInDbOrRedis } from '../../allUser/user/user.utils';

import { GroupMember } from '../groupUserMember/models.groupUserMember';
import { GroupsSearchableFields } from './constants.groups';
import { IGroups, IGroupsFilters } from './interface.groups';
import { Groups } from './models.groups';

const createGroups = async (
  data: IGroups,
  requestUser: IUserRef,
  req: Request,
): Promise<IGroups | null> => {
  const findData = await Groups.findOne({
    name: { $regex: new RegExp(data.name.trim(), 'i') },
    author: new Types.ObjectId(data.author.userId),
    isDelete: false,
  });

  if (findData) {
    throw new ApiError(httpStatus.CONFLICT, 'Groups already exists');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  let group: any;
  try {
    // Create the group in a transaction
    group = await Groups.create([data], { session });
    if (!group) {
      throw new Error('Failed to create group');
    }
    const groupData = {
      groupId: group[0]._id, // Note: `res` will be an array due to `create([data])`
      receiver: {
        userId: requestUser.userId,
        role: requestUser.role,
        roleBaseUserId: requestUser.roleBaseUserId,
      },
      role: 'admin',
    };
    // Create the group member in a transaction
    const createMember = await GroupMember.create([groupData], { session });
    if (!createMember) {
      throw new Error('Failed to create group member');
    }
    // If all operations succeed, commit the transaction
    await session.commitTransaction();
  } catch (error) {
    // If any operation fails, abort the transaction
    await session.abortTransaction();
    // Return error response
  } finally {
    session.endSession();
  }
  console.log(group);
  return group;
};

const checkUserIdToExistGroupsFromDb = async (
  userId: string,
  requestUser: IUserRef,
  req: Request,
): Promise<IGroups | null> => {
  const user = req?.user as IUserRefAndDetails;

  //
  const whenMySender =
    ENUM_REDIS_KEY.RIS_senderId_receiverId + `:${requestUser.userId}:${userId}`;
  const whenMyReceiver =
    ENUM_REDIS_KEY.RIS_senderId_receiverId + `:${userId}:${requestUser.userId}`;
  //
  const [getReceiver, findRedisStringData, userAllSocketIds] =
    await Promise.all([
      validateUserInDbOrRedis([userId]),
      redisClient.mget([whenMySender, whenMyReceiver]),
      findAllSocketsIdsFromUserId(userId as string),
    ]);
  //

  const convertRedisStringDataObject: IGroups[] = [];
  for (const stringGroupsString of findRedisStringData) {
    //loop
    //[string,null]
    if (stringGroupsString && typeof stringGroupsString === 'string') {
      const stringGroupsObjectDate: any = JSON.parse(stringGroupsString);
      //-- I only check if the user ID of the user I want to be friends with is online.
      if (stringGroupsObjectDate.sender.userId === userId) {
        stringGroupsObjectDate.sender = {
          ...stringGroupsObjectDate.sender,
          details: {
            ...stringGroupsObjectDate.sender.details,
            isOnline: userAllSocketIds?.length ? true : false,
          },
        };
      } else {
        stringGroupsObjectDate.receiver = {
          ...stringGroupsObjectDate.receiver,
          details: {
            ...stringGroupsObjectDate.receiver.details,
            isOnline: userAllSocketIds?.length ? true : false,
          },
        };
      }
      convertRedisStringDataObject.push(stringGroupsObjectDate);
    }
  }

  if (convertRedisStringDataObject.length) {
    return convertRedisStringDataObject[0]; //? when find in redis then return
  }

  //----------------------end---------------------

  const pipeline: PipelineStage[] = [
    {
      $match: {
        $or: [
          {
            'sender.userId': new Types.ObjectId(userId as string),
            'receiver.userId': new Types.ObjectId(
              requestUser?.userId as string,
            ),
          },
          {
            'sender.userId': new Types.ObjectId(requestUser?.userId as string),
            'receiver.userId': new Types.ObjectId(userId as string),
          },
        ],
      },
    },
  ];

  LookupAnyRoleDetailsReusable(pipeline, {
    collections: [
      {
        roleMatchFiledName: 'sender.role',
        idFiledName: 'sender.roleBaseUserId', //$sender.roleBaseUserId
        pipeLineMatchField: '_id', //$_id
        outPutFieldName: 'details',
        margeInField: 'sender',

        project: { name: 1, country: 1, profileImage: 1, email: 1 },
      },
      {
        roleMatchFiledName: 'receiver.role',
        idFiledName: 'receiver.roleBaseUserId', //$receiver.roleBaseUserId
        pipeLineMatchField: '_id', //$_id
        outPutFieldName: 'details',
        margeInField: 'receiver',

        project: { name: 1, country: 1, profileImage: 1, email: 1 },
      },
    ],
  });

  const findDataArray = await Groups.aggregate(pipeline);
  const findData = findDataArray[0];

  if (findData) {
    await redisSetter<IGroups>([
      { key: whenMySender, value: findData, ttl: 24 * 60 },
      { key: whenMyReceiver, value: findData, ttl: 24 * 60 },
    ]);
  }
  //------ check online office------
  const promises2: any[] = [];
  promises2.push(findAllSocketsIdsFromUserId(userId as string));
  // promises2.push(
  //   findAllSocketsIdsFromUserId(findData.receiver.userId as string),
  // );
  const resolved2 = await Promise.all(promises2);

  if (findData.sender.userId === userId) {
    findData.sender = {
      ...findData.sender,
      //@ts-ignore
      isOnline: resolved2[0].length ? true : false,
    };
  } else {
    findData.receiver = {
      ...findData.receiver,
      //@ts-ignore
      isOnline: resolved2[0].length ? true : false,
    };
  }
  //--------------end------------

  return findData;
};
const getSingleGroupsFromDB = async (
  id: string,
  req?: Request,
): Promise<IGroups | null> => {
  const result = await Groups.isGroupsExistMethod(id, {
    populate: true,
  });

  //-------------------------------
  return result;
};
const getAllGroupssFromDB = async (
  filters: IGroupsFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<IGroups[] | null>> => {
  const {
    searchTerm,
    needProperty,
    createdAtFrom,
    createdAtTo,
    projectStart,
    projectDeadline,
    ...filtersData
  } = filters;
  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete == 'true'
      ? true
      : false
    : false;

  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      $or: GroupsSearchableFields.map((field: string) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filtersData).length) {
    const condition = Object.entries(filtersData).map(
      //@ts-ignore
      ([field, value]: [keyof typeof filtersData, string]) => {
        let modifyFiled;
        if (field === 'orderId' || field === 'paymentId') {
          modifyFiled = {
            [field]: new Types.ObjectId(value),
          };
        } else if (field === 'authorUserId') {
          modifyFiled = {
            ['author.userId']: new Types.ObjectId(value),
          };
        } else if (field === 'authorRoleBaseId') {
          modifyFiled = {
            ['author.roleBaseUserId']: new Types.ObjectId(value),
          };
        }
        //  else if (field === 'from') {
        //   modifyFiled = {
        //     ['from']: { $gte: new Date(value) },
        //   };
        // } else if (field === 'to') {
        //   modifyFiled = {
        //     ['to']: { $lte: new Date(value) },
        //   };
        // }
        else {
          modifyFiled = { [field]: value };
        }

        return modifyFiled;
      },
    );
    //
    if (createdAtFrom && !createdAtTo) {
      //only single data in register all data -> 2022-02-25_12:00_am to 2022-02-25_11:59 pm minutes
      const timeTo = new Date(createdAtFrom);
      const createdAtToModify = new Date(timeTo.setHours(23, 59, 59, 999));
      condition.push({
        //@ts-ignore
        createdAt: {
          $gte: new Date(createdAtFrom),
          $lte: new Date(createdAtToModify),
        },
      });
    } else if (createdAtFrom && createdAtTo) {
      condition.push({
        //@ts-ignore
        createdAt: {
          $gte: new Date(createdAtFrom),
          $lte: new Date(createdAtTo),
        },
      });
    }

    if (projectStart && !projectDeadline) {
      //only single data in register all data -> 2022-02-25_12:00_am to 2022-02-25_11:59 pm minutes
      const timeTo = new Date(projectStart);
      const projectDeadlineModify = new Date(timeTo.setHours(23, 59, 59, 999));
      condition.push({
        //@ts-ignore
        createdAt: {
          $gte: new Date(projectStart),
          $lte: new Date(projectDeadlineModify),
        },
      });
    } else if (projectStart && projectDeadline) {
      condition.push({
        //@ts-ignore
        createdAt: {
          $gte: new Date(projectStart),
          $lte: new Date(projectDeadline),
        },
      });
    }

    //
    andConditions.push({
      $and: condition,
    });
  }
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);
  const sortConditions: { [key: string]: 1 | -1 } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
  }

  //****************pagination end ***************/

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};
  //!------------check -access validation ------------------
  const check = await Groups.findOne(whereConditions);
  if (check) {
    if (
      req?.user?.role !== ENUM_USER_ROLE.admin &&
      req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
      check?.author?.userId.toString() !== req?.user?.userId
    ) {
      throw new ApiError(httpStatus.FORBIDDEN, 'forbidden access data');
    }
  }
  //!------------check -access validation ------------------
  const pipeline: PipelineStage[] = [
    { $match: whereConditions },
    { $sort: sortConditions },
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
  ];

  //-----------------needProperty--lookup--------------------
  if (
    needProperty?.toLowerCase()?.includes('senderinfo') ||
    needProperty?.toLowerCase()?.includes('receiverinfo')
  ) {
    const collections = [];
    if (needProperty?.toLowerCase()?.includes('senderinfo')) {
      collections.push({
        roleMatchFiledName: 'sender.role',
        idFiledName: 'sender.roleBaseUserId', //$sender.roleBaseUserId
        pipeLineMatchField: '_id', //$_id
        outPutFieldName: 'details',
        margeInField: 'sender',
        project: { name: 1, profileImage: 1, email: 1 },
      });
    }
    if (needProperty?.toLowerCase()?.includes('receiverinfo')) {
      collections.push({
        roleMatchFiledName: 'receiver.role',
        idFiledName: 'receiver.roleBaseUserId', //$receiver.roleBaseUserId
        pipeLineMatchField: '_id', //$_id
        outPutFieldName: 'details',
        margeInField: 'receiver',
        project: { name: 1, profileImage: 1, email: 1 },
      });
    }
    LookupAnyRoleDetailsReusable(pipeline, {
      collections: collections,
    });
    //!when user multiple data then must be sort 2 time because when use LookupAnyRoleDetailsReusable then data is unsort . so use sortCondition is atlast 2 times
    //single data in not use
    pipeline.push({ $sort: sortConditions });
  }
  //
  const collections: ILookupCollection<any>[] = [];

  if (needProperty && needProperty.includes('lastMessage')) {
    const lastMessagePipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'chatmessages',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$GroupsId', '$$id'] },
                    {
                      $eq: [
                        '$sender.userId',
                        new Types.ObjectId(req?.user?.userId),
                      ],
                    },
                  ],
                },
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $limit: 1,
            },
            {
              $project: {
                _id: 1,
                message: 1,
                createdAt: 1,
                createTime: 1,
                files: {
                  $cond: {
                    if: { $eq: [{ $type: '$files' }, 'array'] }, // Check if `files` exists and is an array
                    then: { $size: '$files' }, // If it exists, get the array size
                    else: 0, // If it doesn't exist, set to 0
                  },
                },
              },
            },
          ],
          as: 'lastMessageDetails',
        },
      },
      {
        $addFields: {
          lastMessageDetails: {
            $cond: {
              if: { $eq: [{ $size: '$lastMessageDetails' }, 0] },
              then: {},
              else: { $arrayElemAt: ['$lastMessageDetails', 0] },
            },
          },
        },
      },
    ];

    pipeline.push(...lastMessagePipeline);
  }

  // Use the collections in LookupReusable
  LookupReusable<any, any>(pipeline, {
    collections: collections,
    // spliceStart:4
  });
  const resultArray = [
    Groups.aggregate(pipeline),
    Groups.countDocuments(whereConditions),
  ];
  const result = await Promise.all(resultArray);
  //!-- alternatively and faster
  /*
   const pipeLineResult = await Groups.aggregate([
    {
      $facet: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        data: pipeline,
        countDocuments: [
          {
            $match: whereConditions,
          },
          { $count: 'totalData' },
        ],
      },
    },
  ]);
  // Extract and format the pipeLineResults
  const total = pipeLineResult[0]?.countDocuments[0]?.totalData || 0; // Extract total count
  const result = pipeLineResult[0]?.data || []; // Extract data 
  */
  if (Array.isArray(result[0])) {
    result[0].forEach((group: IGroups) => {
      if (
        req?.user?.role !== ENUM_USER_ROLE.admin &&
        req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
        group?.author?.userId.toString() !== req?.user?.userId
      ) {
        throw new ApiError(httpStatus.FORBIDDEN, 'forbidden access data');
      }
    });
  }
  return {
    meta: {
      page,
      limit,
      total: result[1] as number,
    },
    data: result[0] as IGroups[],
  };
};

const updateGroupsFromDB = async (
  id: string,
  data: IGroups,
  req: Request,
): Promise<IGroups | null> => {
  const isExist = (await Groups.findById(id)) as IGroups & {
    _id: Schema.Types.ObjectId;
  } as IGroups;
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Groups not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.author?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { ...GroupsData } = data;
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin
  ) {
    delete (GroupsData as Partial<IGroups>)['isDelete']; // remove it because , any user
  }

  const updatedGroupsData: Partial<IGroups> = { ...GroupsData };

  const updatedGroups = await Groups.findOneAndUpdate(
    { _id: id },
    updatedGroupsData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedGroups) {
    throw new ApiError(400, 'Failed to update Groups');
  }
  return updatedGroups;
};

const updateGroupsListSortFromDb = async (
  id: string,
  data: IGroups,
  req: Request,
): Promise<IGroups | null> => {
  // const updatedGroups = await Groups.findOneAndUpdate(
  //   { _id: id },
  //   data,
  //   {
  //     new: true,
  //     runValidators: true,
  //   },
  // );
  // return updatedGroups;

  await produceUpdateGroupMemberListSortKafka(
    JSON.stringify({ id, value: data }),
  );
  return null;
};

const deleteGroupsFromDB = async (
  id: string,
  query: IGroupsFilters,
  req: Request,
): Promise<IGroups | null> => {
  // const isExist = (await Groups.findById(id).select('+password')) as IGroups & {
  //   _id: Schema.Types.ObjectId;
  // };
  const isExist = (await Groups.aggregate([
    { $match: { _id: new Types.ObjectId(id), isDelete: false } },
  ])) as IGroups[];

  if (!isExist.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Groups not found');
  }

  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    isExist[0]?.author?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  let data;

  if (
    query.delete == 'yes' && // this is permanently delete but store trash collection
    (req?.user?.role == ENUM_USER_ROLE.admin ||
      req?.user?.role == ENUM_USER_ROLE.superAdmin)
  ) {
    data = await Groups.findOneAndDelete({ _id: id });
  } else {
    data = await Groups.findOneAndUpdate(
      { _id: id },
      { isDelete: true },
      { new: true, runValidators: true },
    );
  }
  return data;
};

export const GroupsService = {
  createGroups,
  getAllGroupssFromDB,
  updateGroupsFromDB,
  getSingleGroupsFromDB,
  deleteGroupsFromDB,
  checkUserIdToExistGroupsFromDb,
  //
  updateGroupsListSortFromDb,
};
