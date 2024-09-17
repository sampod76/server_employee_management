/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import httpStatus from 'http-status';
import { PipelineStage, Schema, Types } from 'mongoose';
import { ENUM_YN } from '../../../global/enum_constant_type';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { paginationHelper } from '../../../helper/paginationHelper';
import ApiError from '../../errors/ApiError';
import { IGenericResponse } from '../../interface/common';
import { IPaginationOption } from '../../interface/pagination';

import { LookupAnyRoleDetailsReusable } from '../../../helper/lookUpResuable';

import { findAllSocketsIdsFromUserId } from '../../redis/service.redis';
import { IUserRef } from '../allUser/typesAndConst';
import { IUser } from '../allUser/user/user.interface';
import { User } from '../allUser/user/user.model';
import { RequestToRefUserObject } from '../allUser/user/user.utils';
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

  if (!resolved[0] || resolved[0]?.isDelete === ENUM_YN.YES) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Receiver not found');
  }
  if (resolved[1]) {
    throw new ApiError(httpStatus.CONFLICT, 'Friendship already exists');
  }

  data.receiver = {
    userId: resolved[0]?._id,
    role: resolved[0]?.role,
    //@ts-ignore
    roleBaseUserId: resolved[0]?.roleInfo?._id,
  };
  // console.log(data, 'data');
  const res = await FriendShip.create(data);

  return res;
};

const getAllFriendShipsFromDB = async (
  filters: IFriendShipFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<IFriendShip[] | null>> => {
  const { searchTerm, needProperty, ...filtersData } = filters;
  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete
    : ENUM_YN.NO;

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
          /* 
        if (field === 'userRoleBaseId' || field === 'referRoleBaseId') {
          modifyFiled = { [field]: new Types.ObjectId(value) };
        } else {
          modifyFiled = { [field]: value };
        } 
        */
          if (field === 'senderUserId') {
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
          } else if (field === 'myData' && value === ENUM_YN.YES) {
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
  const check = (await FriendShip.aggregate([
    {
      $match: whereConditions,
    },
    {
      $limit: 1,
    },
  ])) as IFriendShip[];
  if (check.length) {
    if (
      check[0].receiver.userId.toString() !== req?.user?.userId &&
      check[0].sender.userId.toString() !== req?.user?.userId &&
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
        outPutFieldName: 'senderDetails',
        //project: { name: 1, country: 1, profileImage: 1, email: 1 },
      });
    }
    if (needProperty?.toLowerCase()?.includes('receiverinfo')) {
      collections.push({
        roleMatchFiledName: 'receiver.role',
        idFiledName: 'receiver.roleBaseUserId', //$receiver.roleBaseUserId
        pipeLineMatchField: '_id', //$_id
        outPutFieldName: 'receiverDetails',
        //project: { name: 1, country: 1, profileImage: 1, email: 1 },
      });
    }
    LookupAnyRoleDetailsReusable(pipeline, {
      collections: collections,
    });
  }

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
  if (block?.isBlock === ENUM_YN.NO) {
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

const getSingleFriendShipFromDB = async (
  id: string,
  req?: Request,
): Promise<IFriendShip | null> => {
  const user = await FriendShip.isFriendShipExistMethod(id, {
    populate: true,
  });
  //------ check online office------
  const promises = [];
  promises.push(findAllSocketsIdsFromUserId(user.sender.userId as string));
  promises.push(findAllSocketsIdsFromUserId(user.receiver.userId as string));
  const resolved = await Promise.all(promises);

  user.sender = {
    ...user.sender,
    //@ts-ignore
    isOnline: resolved[0].length ? true : false,
  };
  user.receiver = {
    ...user.receiver,
    //@ts-ignore
    isOnline: resolved[1].length ? true : false,
  };
  //-------------------------------
  return user;
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
    { $match: { _id: new Types.ObjectId(id), isDelete: ENUM_YN.NO } },
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
    query.delete == ENUM_YN.YES && // this is permanently delete but store trash collection
    (req?.user?.role == ENUM_USER_ROLE.admin ||
      req?.user?.role == ENUM_USER_ROLE.superAdmin)
  ) {
    data = await FriendShip.findOneAndDelete({ _id: id });
  } else {
    data = await FriendShip.findOneAndUpdate(
      { _id: id },
      { isDelete: ENUM_YN.YES },
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
};
