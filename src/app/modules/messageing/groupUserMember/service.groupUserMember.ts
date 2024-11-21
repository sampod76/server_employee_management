/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import httpStatus from 'http-status';
import { PipelineStage, Schema, Types } from 'mongoose';
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
import { IUser } from '../../allUser/user/user.interface';
import { User } from '../../allUser/user/user.model';
import {
  RequestToRefUserObject,
  validateUserInDbOrRedis,
} from '../../allUser/user/user.utils';

import { IGroups } from '../groups/interface.groups';
import { Groups } from '../groups/models.groups';
import { GroupMemberSearchableFields } from './constants.groupUserMember';
import { IGroupMember, IGroupMemberFilters } from './interface.groupUserMember';
import { GroupMember } from './models.groupUserMember';

const createGroupMember = async (
  data: IGroupMember,
  requestUser: IUserRef,
  req: Request,
): Promise<IGroupMember | null> => {
  const [receiver, groupMember, groupValidation] = await Promise.all([
    User.isUserFindMethod(
      { id: data.receiver.userId as string },
      { populate: true },
    ) as Promise<IUser>,
    GroupMember.findOne({
      $or: [
        {
          'sender.userId': new Types.ObjectId(data.sender?.userId as string),
          'receiver.userId': new Types.ObjectId(
            data.receiver?.userId as string,
          ),
          groupId: new Types.ObjectId(data.groupId as string),
          isDelete: false,
        },
        {
          'sender.userId': new Types.ObjectId(data.receiver?.userId as string),
          'receiver.userId': new Types.ObjectId(data.sender?.userId as string),
          groupId: new Types.ObjectId(data.groupId as string),
          isDelete: false,
        },
      ],
    }),
    Groups.findOne({
      _id: data.groupId,
      isDelete: false,
    }),
  ]);

  // Validate Receiver
  if (!receiver) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Receiver not found');
  }

  // Validate GroupMember
  if (groupMember) {
    throw new ApiError(httpStatus.CONFLICT, 'GroupMember already exists');
  }
  // Validate Group
  if (!groupValidation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
  } else if (
    groupValidation.author.userId.toString() !== data.sender.userId.toString()
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, 'forbidden access');
  }

  data.receiver = {
    userId: receiver?._id,
    role: receiver?.role as any,
    //@ts-ignore
    roleBaseUserId: receiver?.roleInfo?._id,
  };

  const res = await GroupMember.create(data);

  return res;
};

const checkUserIdToExistGroupMemberFromDb = async (
  userId: string,
  requestUser: IUserRef,
  req: Request,
): Promise<IGroupMember | null> => {
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

  const convertRedisStringDataObject: IGroupMember[] = [];
  for (const stringGroupMemberString of findRedisStringData) {
    //loop
    //[string,null]
    if (
      stringGroupMemberString &&
      typeof stringGroupMemberString === 'string'
    ) {
      const stringGroupMemberObjectDate: any = JSON.parse(
        stringGroupMemberString,
      );
      //-- I only check if the user ID of the user I want to be friends with is online.
      if (stringGroupMemberObjectDate.sender.userId === userId) {
        stringGroupMemberObjectDate.sender = {
          ...stringGroupMemberObjectDate.sender,
          details: {
            ...stringGroupMemberObjectDate.sender.details,
            isOnline: userAllSocketIds?.length ? true : false,
          },
        };
      } else {
        stringGroupMemberObjectDate.receiver = {
          ...stringGroupMemberObjectDate.receiver,
          details: {
            ...stringGroupMemberObjectDate.receiver.details,
            isOnline: userAllSocketIds?.length ? true : false,
          },
        };
      }
      convertRedisStringDataObject.push(stringGroupMemberObjectDate);
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

  const findDataArray = await GroupMember.aggregate(pipeline);
  const findData = findDataArray[0];

  if (findData) {
    await redisSetter<IGroupMember>([
      { key: whenMySender, value: findData, ttl: 24 * 60 },
      { key: whenMyReceiver, value: findData, ttl: 24 * 60 },
    ]);
  } else {
    if (req.query?.createGroupMember == 'yes') {
      //if when checking and not found GroupMember then auto matic create user
      const receiverInfo = (await User.isUserFindMethod(
        { id: userId },
        { populate: true },
      )) as IUser & { roleInfo: any };

      const createGroupMember = await GroupMember.create({
        receiver: {
          userId: receiverInfo._id,
          roleBaseUserId: receiverInfo.roleInfo._id,
          role: receiverInfo.role,
        },
        sender: {
          userId: user?.userId,
          roleBaseUserId: user?.roleBaseUserId,
          role: user?.role,
        },
      });
      return createGroupMember;
    } else {
      return null;
    }
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
const getSingleGroupMemberFromDB = async (
  id: string,
  req?: Request,
): Promise<IGroupMember | null> => {
  const result = await GroupMember.isGroupMemberExistMethod(id, {
    populate: true,
  });
  if (!GroupMember) {
    return null;
  }
  //------ check online office------
  const promises = [];
  promises.push(findAllSocketsIdsFromUserId(result.sender.userId as string));
  promises.push(findAllSocketsIdsFromUserId(result.receiver.userId as string));
  const resolved = await Promise.all(promises);

  result.sender = {
    ...result.sender,
    //@ts-ignore
    isOnline: resolved[0].length ? true : false,
  };
  result.receiver = {
    ...result.receiver,
    //@ts-ignore
    isOnline: resolved[1].length ? true : false,
  };
  //-------------------------------
  return result;
};
const getAllGroupMembersFromDB = async (
  filters: IGroupMemberFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<IGroupMember[] | null>> => {
  const { searchTerm, needProperty, ...filtersData } = filters;
  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete == 'true'
      ? true
      : false
    : false;

  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      $or: GroupMemberSearchableFields.map((field: string) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(
        //@ts-ignore
        ([field, value]: [keyof typeof filtersData, string]) => {
          let modifyFiled;

          if (field === 'groupId' || field === 'orderId') {
            modifyFiled = { [field]: new Types.ObjectId(value) };
          } else if (field === 'senderUserId') {
            modifyFiled = {
              ['sender.userId']: new Types.ObjectId(value),
            };
          } else if (field === 'senderRoleBaseId') {
            modifyFiled = {
              ['sender.roleBaseUserId']: new Types.ObjectId(value),
            };
          } else if (field === 'receiverUserId') {
            modifyFiled = {
              ['receiver.roleBaseUserId']: new Types.ObjectId(value),
            };
          } else if (field === 'receiverRoleBaseId') {
            modifyFiled = {
              ['receiver.roleBaseUserId']: new Types.ObjectId(value),
            };
          } else if (field === 'isBlock') {
            modifyFiled = {
              ['block.isBlock']: value,
            };
          } else if (field === 'myData' && value === 'yes') {
            modifyFiled = {
              $or: [
                {
                  'receiver.userId': new Types.ObjectId(
                    req?.user?.userId as string,
                  ),
                },
              ],
            };
          } else {
            modifyFiled = { [field]: value };
          }
          return modifyFiled;
        },
      ),
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

  const pipeline: PipelineStage[] = [
    { $match: whereConditions },
    { $sort: sortConditions },
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
  ];

  // if(req?.user?.role !==ENUM_USER_ROLE.admin){
  //   const pipilien2: PipelineStage[] =[
  //     {
  //       $lookup: {
  //         from: 'users',
  //         localField: 'groupId',
  //         foreignField: '_id',
  //         as: 'group',
  //       },
  //     }
  //   ]
  // }

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
  if (needProperty && needProperty.includes('groupId')) {
    const gigCollecting: ILookupCollection<IGroups> = {
      connectionName: 'groups',
      idFiledName: '$groupId',
      pipeLineMatchField: '$_id',
      outPutFieldName: 'groupDetails',
      //project: { name: 1, country: 1, profileImage: 1, email: 1 },
    };
    // Push the object into the collections array
    collections.push(gigCollecting);
  }
  if (needProperty && needProperty.includes('lastMessage')) {
    const lastMessagePipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'groupmessages',
          let: { groupId: '$groupId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$groupId', '$$groupId'] },
                    // {
                    //   $ne: [
                    //     '$sender.userId',
                    //     new Types.ObjectId(req?.user?.userId),
                    //   ],
                    // },
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
                sender: 1,
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
    GroupMember.aggregate(pipeline),
    GroupMember.countDocuments(whereConditions),
  ];
  const result = await Promise.all(resultArray);
  //!-- alternatively and faster
  /*
   const pipeLineResult = await GroupMember.aggregate([
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
  // if (Array.isArray(result[0])) {
  //   result[0].forEach((singleData: IGroupMember) => {
  //     if (
  //       req?.user?.role !== ENUM_USER_ROLE.admin &&
  //       req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
  //       singleData.receiver.userId.toString() !== req?.user?.userId &&
  //       singleData.sender.userId.toString() !== req?.user?.userId
  //     ) {
  //       throw new ApiError(httpStatus.FORBIDDEN, 'forbidden access data');
  //     }
  //   });
  // }
  return {
    meta: {
      page,
      limit,
      total: result[1] as number,
    },
    data: result[0] as IGroupMember[],
  };
};

const updateGroupMemberFromDB = async (
  id: string,
  data: IGroupMember,
  req: Request,
): Promise<IGroupMember | null> => {
  const isExist = (await GroupMember.findById(id)) as IGroupMember & {
    _id: Schema.Types.ObjectId;
  } as IGroupMember;
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'GroupMember not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.sender?.userId?.toString() !== req?.user?.userId &&
    isExist?.receiver?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { block, ...GroupMemberData } = data;
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin
  ) {
    delete (GroupMemberData as Partial<IGroupMember>)['isDelete']; // remove it because , any user update time to not update this field , when user apply delete route to modify this field
    if (isExist?.sender?.userId?.toString() !== req?.user?.userId) {
      //sender not accepted this request
      delete (GroupMemberData as Partial<IGroupMember>)['requestAccept'];
    }
  }

  const updatedGroupMemberData: Partial<IGroupMember> = { ...GroupMemberData };

  const updatedGroupMember = await GroupMember.findOneAndUpdate(
    { _id: id },
    updatedGroupMemberData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedGroupMember) {
    throw new ApiError(400, 'Failed to update GroupMember');
  }
  return updatedGroupMember;
};
const updateGroupMemberBlockFromDb = async (
  id: string,
  data: IGroupMember,
  req: Request,
): Promise<IGroupMember | null> => {
  const isExist = (await GroupMember.findById(id)) as IGroupMember & {
    _id: Schema.Types.ObjectId;
  } as IGroupMember;
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'GroupMember not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.sender?.userId?.toString() !== req?.user?.userId &&
    isExist?.receiver?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { block, ...GroupMemberData } = data;
  const updatedGroupMemberData: Partial<IGroupMember> = { ...GroupMemberData };
  if (block?.isBlock === false) {
    if (
      isExist?.block?.blocker?.userId?.toString() !== req?.user?.userId &&
      req.user?.role !== ENUM_USER_ROLE.admin &&
      req.user?.role !== ENUM_USER_ROLE.superAdmin
    ) {
      throw new ApiError(403, 'forbidden access');
    }

    updatedGroupMemberData['block'] = block;
  } else if (block && Object.keys(block).length) {
    if (isExist?.block?.blocker?.userId?.toString() !== req?.user?.userId) {
      throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Already blocked you');
    }
    Object.keys(block).forEach(key => {
      const nameKey = `block.${key}` as keyof Partial<IGroupMember>;
      (updatedGroupMemberData as any)[nameKey] =
        block[key as keyof typeof block];
    });
    const nameKey = `block.blocker` as keyof Partial<IGroupMember>;
    (updatedGroupMemberData as any)[nameKey] = RequestToRefUserObject(
      req.user as IUserRef,
    );
  }
  const updatedGroupMember = await GroupMember.findOneAndUpdate(
    { _id: id },
    updatedGroupMemberData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedGroupMember) {
    throw new ApiError(400, 'Failed to update GroupMember');
  }
  return updatedGroupMember;
};
const updateGroupMemberListSortFromDb = async (
  id: string,
  data: IGroupMember,
  req: Request,
): Promise<IGroupMember | null> => {
  // const updatedGroupMember = await GroupMember.findOneAndUpdate(
  //   { _id: id },
  //   data,
  //   {
  //     new: true,
  //     runValidators: true,
  //   },
  // );
  // return updatedGroupMember;

  await produceUpdateGroupMemberListSortKafka(
    JSON.stringify({ id, value: data }),
  );
  return null;
};

const deleteGroupMemberFromDB = async (
  id: string,
  query: IGroupMemberFilters,
  req: Request,
): Promise<IGroupMember | null> => {
  // const isExist = (await GroupMember.findById(id).select('+password')) as IGroupMember & {
  //   _id: Schema.Types.ObjectId;
  // };
  const isExist = (await GroupMember.aggregate([
    { $match: { _id: new Types.ObjectId(id), isDelete: false } },
  ])) as IGroupMember[];

  if (!isExist.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'GroupMember not found');
  }

  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    isExist[0]?.sender?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  let data;

  if (
    query.delete == 'yes' && // this is permanently delete but store trash collection
    (req?.user?.role == ENUM_USER_ROLE.admin ||
      req?.user?.role == ENUM_USER_ROLE.superAdmin)
  ) {
    // data = await GroupMember.findOneAndDelete({ _id: id });
    data = null;
  } else {
    data = await GroupMember.findOneAndUpdate(
      { _id: id },
      { isDelete: true },
      { new: true, runValidators: true },
    );
  }
  return data;
};

export const GroupMemberService = {
  createGroupMember,
  getAllGroupMembersFromDB,
  updateGroupMemberFromDB,
  getSingleGroupMemberFromDB,
  deleteGroupMemberFromDB,
  updateGroupMemberBlockFromDb,
  checkUserIdToExistGroupMemberFromDb,
  //
  updateGroupMemberListSortFromDb,
};
