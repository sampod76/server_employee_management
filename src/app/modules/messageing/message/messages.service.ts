import { Request } from 'express';
import httpStatus from 'http-status';
import { PipelineStage, Schema, Types } from 'mongoose';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import { paginationHelper } from '../../../../helper/paginationHelper';
import ApiError from '../../../errors/ApiError';
import { IGenericResponse } from '../../../interface/common';
import { IPaginationOption } from '../../../interface/pagination';

import { IUserRef } from '../../allUser/typesAndConst';

import { messageSearchableFields } from './messages.constants';
import { IChatMessage, IChatMessageFilters } from './messages.interface';
import { ChatMessage } from './messages.models';

const createChatMessage = async (
  data: IChatMessage,
  user?: IUserRef & { id: string },
): Promise<IChatMessage | null> => {
  const res = await ChatMessage.create(data);
  return res;
};

const getAllChatMessagesFromDB = async (
  filters: IChatMessageFilters,
  paginationOptions: IPaginationOption,
  requestUser: IUserRef & { id: string },
): Promise<IGenericResponse<IChatMessage[] | null>> => {
  const { searchTerm, ...filtersData } = filters;
  filtersData.isDelete = filtersData.isDelete ? filtersData.isDelete : false;
  console.log(requestUser);
  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      $or: messageSearchableFields.map((field: string) => ({
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

          if (field === 'friendShipId') {
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
  const check = await ChatMessage.findOne(whereConditions);
  if (check) {
    if (
      check.receiver.userId.toString() !== requestUser?.userId &&
      check.sender.userId.toString() !== requestUser?.userId &&
      requestUser.role !== ENUM_USER_ROLE.admin &&
      requestUser.role !== ENUM_USER_ROLE.superAdmin
    ) {
      throw new ApiError(httpStatus.FORBIDDEN, 'forbidden');
    }
  }

  const pipeline: PipelineStage[] = [
    { $match: whereConditions },
    { $sort: sortConditions },
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
    { $sort: { [sortBy || 'createdAt']: 1 } }, // because first time get last 10 message , then message is readable is sort first message show top, last is last
  ];

  const resultArray = [
    ChatMessage.aggregate(pipeline),
    ChatMessage.countDocuments(whereConditions),
  ];
  const result = await Promise.all(resultArray);

  return {
    meta: {
      page,
      limit,
      total: result[1] as number,
    },
    data: result[0] as IChatMessage[],
  };
};

const updateChatMessageFromDB = async (
  id: string,
  data: IChatMessage,
  user: IUserRef & { id: string },
): Promise<IChatMessage | null> => {
  const isExist = (await ChatMessage.findById(id)) as IChatMessage & {
    _id: Schema.Types.ObjectId;
  };
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ChatMessage not found');
  }
  if (
    user?.role !== ENUM_USER_ROLE.superAdmin &&
    user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.sender?.userId?.toString() !== user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { ...ChatMessageData } = data;
  if (
    user?.role !== ENUM_USER_ROLE.superAdmin &&
    user?.role !== ENUM_USER_ROLE.admin
  ) {
    delete (ChatMessageData as Partial<IChatMessage>)['isDelete']; // remove it because , any user update time to not update this field , when user apply delete route to modify this field
  }
  const updatedChatMessageData: Partial<IChatMessage> = { ...ChatMessageData };

  const updatedChatMessage = await ChatMessage.findOneAndUpdate(
    { _id: id },
    updatedChatMessageData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedChatMessage) {
    throw new ApiError(400, 'Failed to update ChatMessage');
  }
  return updatedChatMessage;
};

const getSingleChatMessageFromDB = async (
  id: string,
  requestUser: IUserRef & { userId: string },
): Promise<IChatMessage | null> => {
  const user = await ChatMessage.isChatMessageExistMethod(id, {
    populate: true,
  });
  if (user) {
    if (
      user.receiver.userId !== requestUser?.userId &&
      user.sender.userId !== requestUser?.userId &&
      requestUser.role !== ENUM_USER_ROLE.admin &&
      requestUser.role !== ENUM_USER_ROLE.superAdmin
    ) {
      throw new ApiError(httpStatus.FORBIDDEN, 'forbidden');
    }
  }
  return user;
};

const deleteChatMessageFromDB = async (
  id: string,
  query: IChatMessageFilters,
  req: Request,
): Promise<IChatMessage | null> => {
  // const isExist = (await ChatMessage.findById(id).select('+password')) as IChatMessage & {
  //   _id: Schema.Types.ObjectId;
  // };
  const isExist = (await ChatMessage.aggregate([
    { $match: { _id: new Types.ObjectId(id), isDelete: false } },
  ])) as IChatMessage[];

  if (!isExist.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ChatMessage not found');
  }

  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    isExist[0]?.sender?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const data = await ChatMessage.findOneAndUpdate(
    { _id: id },
    { isDelete: true },
    { new: true, runValidators: true },
  );

  return data;
};

export const ChatMessageService = {
  createChatMessage,
  getAllChatMessagesFromDB,
  updateChatMessageFromDB,
  getSingleChatMessageFromDB,
  deleteChatMessageFromDB,
};
