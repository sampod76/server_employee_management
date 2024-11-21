import { Request } from 'express';
import httpStatus from 'http-status';
import { PipelineStage, Schema, Types } from 'mongoose';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import { paginationHelper } from '../../../../helper/paginationHelper';
import ApiError from '../../../errors/ApiError';
import { IGenericResponse } from '../../../interface/common';
import { IPaginationOption } from '../../../interface/pagination';

import { IUserRef } from '../../allUser/typesAndConst';

import { groupMessageSearchableFields } from './constants.groupMessage';
import { IGroupMessage, IGroupMessageFilters } from './interface.groupMessage';
import { GroupMessage } from './models.groupMessage';

const createGroupMessage = async (
  data: IGroupMessage,
  user?: IUserRef,
): Promise<IGroupMessage | null> => {
  const res = await GroupMessage.create(data);
  return res;
};

const getAllGroupMessagesFromDB = async (
  filters: IGroupMessageFilters,
  paginationOptions: IPaginationOption,
  requestUser: IUserRef,
): Promise<IGenericResponse<IGroupMessage[] | null>> => {
  const { searchTerm, ...filtersData } = filters;
  filtersData.isDelete = filtersData.isDelete ? filtersData.isDelete : false;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      $or: groupMessageSearchableFields.map((field: string) => ({
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

          if (field === 'groupId') {
            modifyFiled = { [field]: new Types.ObjectId(value) };
          } else if (field === 'senderUserId') {
            modifyFiled = {
              ['sender.userId']: new Types.ObjectId(value),
            };
          } else if (field === 'senderRoleBaseId') {
            modifyFiled = {
              ['sender.roleBaseUserId']: new Types.ObjectId(value),
            };
          } else if (field === 'findMyChats' && value === 'yes') {
            modifyFiled = {
              $or: [
                {
                  'sender.userId': new Types.ObjectId(
                    requestUser.userId as string,
                  ),
                },
                {
                  'receiver.userId': new Types.ObjectId(
                    requestUser.userId as string,
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
  // const check = await GroupMessage.findOne(whereConditions);
  // if (check) {
  //   if (
  //     check.sender.userId.toString() !== requestUser?.userId &&
  //     requestUser.role !== ENUM_USER_ROLE.admin &&
  //     requestUser.role !== ENUM_USER_ROLE.superAdmin
  //   ) {
  //     throw new ApiError(httpStatus.FORBIDDEN, 'forbidden');
  //   }
  // }

  const pipeline: PipelineStage[] = [
    { $match: whereConditions },
    { $sort: sortConditions },
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
    { $sort: { [sortBy || 'createdAt']: 1 } }, // because first time get last 10 message , then message is readable is sort first message show top, last is last
  ];

  const resultArray = [
    GroupMessage.aggregate(pipeline),
    GroupMessage.countDocuments(whereConditions),
  ];
  const result = await Promise.all(resultArray);
  // if (Array.isArray(result[0])) {
  //   result[0].forEach((singleData: IGroupMessage) => {
  //     if (
  //       requestUser?.role !== ENUM_USER_ROLE.admin &&
  //       requestUser?.role !== ENUM_USER_ROLE.superAdmin &&
  //       singleData.sender.userId.toString() !== requestUser?.userId
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
    data: result[0] as IGroupMessage[],
  };
};

const updateGroupMessageFromDB = async (
  id: string,
  data: IGroupMessage,
  user: IUserRef & { id: string },
): Promise<IGroupMessage | null> => {
  const isExist = (await GroupMessage.findById(id)) as IGroupMessage & {
    _id: Schema.Types.ObjectId;
  };
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'GroupMessage not found');
  }
  if (
    user?.role !== ENUM_USER_ROLE.superAdmin &&
    user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.sender?.userId?.toString() !== user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { ...GroupMessageData } = data;
  if (
    user?.role !== ENUM_USER_ROLE.superAdmin &&
    user?.role !== ENUM_USER_ROLE.admin
  ) {
    delete (GroupMessageData as Partial<IGroupMessage>)['isDelete']; // remove it because , any user update time to not update this field , when user apply delete route to modify this field
  }
  const updatedGroupMessageData: Partial<IGroupMessage> = {
    ...GroupMessageData,
  };

  const updatedGroupMessage = await GroupMessage.findOneAndUpdate(
    { _id: id },
    updatedGroupMessageData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedGroupMessage) {
    throw new ApiError(400, 'Failed to update GroupMessage');
  }
  return updatedGroupMessage;
};

const getSingleGroupMessageFromDB = async (
  id: string,
  requestUser: IUserRef & { userId: string },
): Promise<IGroupMessage | null> => {
  const user = await GroupMessage.isGroupMessageExistMethod(id, {
    populate: true,
  });
  if (user) {
    if (
      user?.sender?.userId !== requestUser?.userId &&
      requestUser.role !== ENUM_USER_ROLE.admin &&
      requestUser.role !== ENUM_USER_ROLE.superAdmin
    ) {
      throw new ApiError(httpStatus.FORBIDDEN, 'forbidden');
    }
  }
  return user;
};

const deleteGroupMessageFromDB = async (
  id: string,
  query: IGroupMessageFilters,
  req: Request,
): Promise<IGroupMessage | null> => {
  // const isExist = (await GroupMessage.findById(id).select('+password')) as IGroupMessage & {
  //   _id: Schema.Types.ObjectId;
  // };
  const isExist = (await GroupMessage.aggregate([
    { $match: { _id: new Types.ObjectId(id), isDelete: false } },
  ])) as IGroupMessage[];

  if (!isExist.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'GroupMessage not found');
  }

  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    isExist[0]?.sender?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const data = await GroupMessage.findOneAndUpdate(
    { _id: id },
    { isDelete: true },
    { new: true, runValidators: true },
  );

  return data;
};

export const GroupMessageService = {
  createGroupMessage,
  getAllGroupMessagesFromDB,
  updateGroupMessageFromDB,
  getSingleGroupMessageFromDB,
  deleteGroupMessageFromDB,
};
