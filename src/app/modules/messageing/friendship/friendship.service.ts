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

import { produceUpdateFriendShipListSortKafka } from '../../../kafka/producer.kafka';
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

import { friendshipSearchableFields } from './friendship.constants';
import { IFriendShip, IFriendShipFilters } from './friendship.interface';
import { FriendShip } from './friendship.models';

const createFriendShip = async (
  data: IFriendShip,
  requestUser: IUserRef,
  req: Request,
): Promise<IFriendShip | null> => {
  const promises = [];
  const getReceiver = User.isUserFindMethod(
    { id: data.receiver.userId as string },
    { populate: true },
  ) as Promise<IUser>;
  promises.push(getReceiver);
  const findData: any = FriendShip.findOne({
    $or: [
      {
        'sender.userId': new Types.ObjectId(data.sender?.userId as string),
        'receiver.userId': new Types.ObjectId(data.receiver?.userId as string),
      },
      {
        'sender.userId': new Types.ObjectId(data.receiver?.userId as string),
        'receiver.userId': new Types.ObjectId(data.sender?.userId as string),
      },
    ],
  });

  promises.push(findData);
  const resolved = (await Promise.all(promises)) as [
    IUser | null,
    IFriendShip | null,
  ];

  if (!resolved[0] || resolved[0]?.isDelete === true) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Receiver not found');
  }
  if (resolved[1]) {
    throw new ApiError(httpStatus.CONFLICT, 'Friendship already exists');
  }

  data.receiver = {
    userId: resolved[0]?._id,
    role: resolved[0]?.role as any,
    //@ts-ignore
    roleBaseUserId: resolved[0]?.roleInfo?._id,
  };

  const res = await FriendShip.create(data);

  return res;
};

const checkUserIdToExistFriendShipFromDb = async (
  userId: string,
  requestUser: IUserRef,
  req: Request,
): Promise<IFriendShip | null> => {
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

  const convertRedisStringDataObject: IFriendShip[] = [];
  for (const stringFriendShipString of findRedisStringData) {
    //loop
    //[string,null]
    if (stringFriendShipString && typeof stringFriendShipString === 'string') {
      const stringFriendShipObjectDate: any = JSON.parse(
        stringFriendShipString,
      );
      //-- I only check if the user ID of the user I want to be friends with is online.
      if (stringFriendShipObjectDate.sender.userId === userId) {
        stringFriendShipObjectDate.sender = {
          ...stringFriendShipObjectDate.sender,
          details: {
            ...stringFriendShipObjectDate.sender.details,
            isOnline: userAllSocketIds?.length ? true : false,
          },
        };
      } else {
        stringFriendShipObjectDate.receiver = {
          ...stringFriendShipObjectDate.receiver,
          details: {
            ...stringFriendShipObjectDate.receiver.details,
            isOnline: userAllSocketIds?.length ? true : false,
          },
        };
      }
      convertRedisStringDataObject.push(stringFriendShipObjectDate);
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

  const findDataArray = await FriendShip.aggregate(pipeline);
  const findData = findDataArray[0];

  if (findData) {
    await redisSetter<IFriendShip>([
      { key: whenMySender, value: findData, ttl: 24 * 60 },
      { key: whenMyReceiver, value: findData, ttl: 24 * 60 },
    ]);
  } else {
    if (req.query?.createFriendShip == 'yes') {
      //if when checking and not found friendship then auto matic create user
      const receiverInfo = (await User.isUserFindMethod(
        { id: userId },
        { populate: true },
      )) as IUser & { roleInfo: any };

      const createfriendShip = await FriendShip.create({
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
      const convertData = createfriendShip.toObject();
      //@ts-ignore
      convertData.newAccount = true;
      return convertData;
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
const getSingleFriendShipFromDB = async (
  id: string,
  req?: Request,
): Promise<IFriendShip | null> => {
  const friendShip = await FriendShip.isFriendShipExistMethod(id, {
    populate: true,
  });
  if (!friendShip) {
    return null;
  }
  //------ check online office------
  const promises = [];
  promises.push(
    findAllSocketsIdsFromUserId(friendShip.sender.userId as string),
  );
  promises.push(
    findAllSocketsIdsFromUserId(friendShip.receiver.userId as string),
  );
  const resolved = await Promise.all(promises);

  friendShip.sender = {
    ...friendShip.sender,
    //@ts-ignore
    isOnline: resolved[0].length ? true : false,
  };
  friendShip.receiver = {
    ...friendShip.receiver,
    //@ts-ignore
    isOnline: resolved[1].length ? true : false,
  };
  //-------------------------------
  return friendShip;
};
const getAllFriendShipsFromDB = async (
  filters: IFriendShipFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<IFriendShip[] | null>> => {
  const { searchTerm, needProperty, ...filtersData } = filters;
  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete == 'true'
      ? true
      : false
    : false;
  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      $or: friendshipSearchableFields.map((field: string) => ({
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

          if (field === 'gigId' || field === 'orderId') {
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
                  'sender.userId': new Types.ObjectId(
                    req?.user?.userId as string,
                  ),
                },
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
  //!------------check -access validation ------------------
  const check = (await FriendShip.findOne(whereConditions)) as IFriendShip;
  if (check) {
    if (
      check.receiver.userId.toString() !== req?.user?.userId &&
      check.sender.userId.toString() !== req?.user?.userId &&
      req?.user?.role !== ENUM_USER_ROLE.admin &&
      req?.user?.role !== ENUM_USER_ROLE.superAdmin
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
                    { $eq: ['$friendShipId', '$$id'] },
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
    FriendShip.aggregate(pipeline),
    FriendShip.countDocuments(whereConditions),
  ];
  const result = await Promise.all(resultArray);
  //!-- alternatively and faster
  /*
   const pipeLineResult = await FriendShip.aggregate([
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
    result[0].forEach((group: IFriendShip) => {
      if (
        req?.user?.role !== ENUM_USER_ROLE.admin &&
        req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
        group.receiver.userId.toString() !== req?.user?.userId &&
        group.sender.userId.toString() !== req?.user?.userId
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
    data: result[0] as IFriendShip[],
  };
};

const updateFriendShipFromDB = async (
  id: string,
  data: IFriendShip,
  req: Request,
): Promise<IFriendShip | null> => {
  const isExist = (await FriendShip.findById(id)) as IFriendShip & {
    _id: Schema.Types.ObjectId;
  } as IFriendShip;
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'FriendShip not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.sender?.userId?.toString() !== req?.user?.userId &&
    isExist?.receiver?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { block, ...FriendShipData } = data;
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin
  ) {
    delete (FriendShipData as Partial<IFriendShip>)['isDelete']; // remove it because , any user update time to not update this field , when user apply delete route to modify this field
    if (isExist?.sender?.userId?.toString() !== req?.user?.userId) {
      //sender not accepted this request
      delete (FriendShipData as Partial<IFriendShip>)['requestAccept'];
    }
  }

  const updatedFriendShipData: Partial<IFriendShip> = { ...FriendShipData };

  const updatedFriendShip = await FriendShip.findOneAndUpdate(
    { _id: id },
    updatedFriendShipData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedFriendShip) {
    throw new ApiError(400, 'Failed to update FriendShip');
  }
  return updatedFriendShip;
};
const updateFriendShipBlockFromDb = async (
  id: string,
  data: IFriendShip,
  req: Request,
): Promise<IFriendShip | null> => {
  const isExist = (await FriendShip.findById(id)) as IFriendShip & {
    _id: Schema.Types.ObjectId;
  } as IFriendShip;
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'FriendShip not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.sender?.userId?.toString() !== req?.user?.userId &&
    isExist?.receiver?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { block, ...FriendShipData } = data;
  const updatedFriendShipData: Partial<IFriendShip> = { ...FriendShipData };
  if (block?.isBlock === false) {
    if (
      isExist?.block?.blocker?.userId?.toString() !== req?.user?.userId &&
      req.user?.role !== ENUM_USER_ROLE.admin &&
      req.user?.role !== ENUM_USER_ROLE.superAdmin
    ) {
      throw new ApiError(403, 'forbidden access');
    }

    updatedFriendShipData['block'] = block;
  } else if (block && Object.keys(block).length) {
    if (isExist?.block?.blocker?.userId?.toString() !== req?.user?.userId) {
      throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Already blocked you');
    }
    Object.keys(block).forEach(key => {
      const nameKey = `block.${key}` as keyof Partial<IFriendShip>;
      (updatedFriendShipData as any)[nameKey] =
        block[key as keyof typeof block];
    });
    const nameKey = `block.blocker` as keyof Partial<IFriendShip>;
    (updatedFriendShipData as any)[nameKey] = RequestToRefUserObject(
      req.user as IUserRef,
    );
  }
  const updatedFriendShip = await FriendShip.findOneAndUpdate(
    { _id: id },
    updatedFriendShipData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedFriendShip) {
    throw new ApiError(400, 'Failed to update FriendShip');
  }
  return updatedFriendShip;
};
const updateFriendShipListSortFromDb = async (
  id: string,
  data: IFriendShip,
  req: Request,
): Promise<IFriendShip | null> => {
  // const updatedFriendShip = await FriendShip.findOneAndUpdate(
  //   { _id: id },
  //   data,
  //   {
  //     new: true,
  //     runValidators: true,
  //   },
  // );
  // return updatedFriendShip;

  await produceUpdateFriendShipListSortKafka(
    JSON.stringify({ id, value: data }),
  );
  return null;
};

const deleteFriendShipFromDB = async (
  id: string,
  query: IFriendShipFilters,
  req: Request,
): Promise<IFriendShip | null> => {
  // const isExist = (await FriendShip.findById(id).select('+password')) as IFriendShip & {
  //   _id: Schema.Types.ObjectId;
  // };
  const isExist = (await FriendShip.aggregate([
    { $match: { _id: new Types.ObjectId(id), isDelete: false } },
  ])) as IFriendShip[];

  if (!isExist.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'FriendShip not found');
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
    data = await FriendShip.findOneAndDelete({ _id: id });
  } else {
    data = await FriendShip.findOneAndUpdate(
      { _id: id },
      { isDelete: true },
      { new: true, runValidators: true },
    );
  }
  return data;
};

export const FriendShipService = {
  createFriendShip,
  getAllFriendShipsFromDB,
  updateFriendShipFromDB,
  getSingleFriendShipFromDB,
  deleteFriendShipFromDB,
  updateFriendShipBlockFromDb,
  checkUserIdToExistFriendShipFromDb,
  //
  updateFriendShipListSortFromDb,
};
