/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request } from 'express';
import httpStatus from 'http-status';
import { PipelineStage, Types } from 'mongoose';

import { I_YN } from '../../../global/enum_constant_type';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { paginationHelper } from '../../../helper/paginationHelper';
import ApiError from '../../errors/ApiError';
import { IGenericResponse } from '../../interface/common';
import { IPaginationOption } from '../../interface/pagination';
import { Notification_SearchableFields } from './notification.constant';
import { INotification, INotificationFilters } from './notification.interface';
import { Notification } from './notification.model';
import { sendNotificationFromDB } from './notification.utls';

const createNotificationToDB = async (
  data: INotification,
  req?: Request,
  sendNotificationByService?: I_YN,
): Promise<INotification | null> => {
  if (req?.query?.isSendNotification === 'yes' || sendNotificationByService) {
    if (data.userIds && data?.userIds?.length > 0) {
      sendNotificationFromDB<INotification>(
        data.userIds.map(userId => {
          const { userIds, ...other } = data;
          return {
            userId: userId.toString(),
            message: 'Notification send successfully sent',
            data: other,
          };
        }),
      );
    }
    if (data.role) {
      sendNotificationFromDB<INotification>([
        {
          role: data.role,
          message: 'Notification send successfully sent',
          data: data,
        },
      ]);
    }
  }
  const createNotification = await Notification.create(data);
  return createNotification;
};

const getAllNotificationsFromDB = async (
  filters: INotificationFilters,
  paginationOptions: IPaginationOption,
): Promise<IGenericResponse<INotification[] | null>> => {
  const { searchTerm, ...filtersData } = filters;

  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete == 'true'
      ? true
      : false
    : false;
  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      $or: Notification_SearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) =>
        field === 'userId'
          ? {
              ['userIds']: { $in: [new Types.ObjectId(value as string)] },
            }
          : {
              [field]: value,
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
  // const result = await Notification.aggregate(pipeline);
  // const total = await Notification.countDocuments(whereConditions);
  //!-- alternatively and faster
  const pipeLineResult = await Notification.aggregate([
    {
      $facet: {
        //eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleNotificationFromDB = async (
  id: string,
  req: Request,
): Promise<INotification | null> => {
  const pipeline: PipelineStage[] = [
    { $match: { _id: new Types.ObjectId(id) } },
  ];
  const result = await Notification.aggregate(pipeline);
  if (!result[0]) {
    throw new ApiError(httpStatus.NOT_FOUND, req.t('notification not found'));
  }
  return result[0];
};

const updateNotificationFromDB = async (
  id: string,
  shop: INotification,
  req: Request,
): Promise<INotification | null> => {
  const isExist = await Notification.findById(id);
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, req.t('notification not found'));
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    !isExist?.userIds?.includes(req?.user?.userId)
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const notificationData = (await Notification.findOneAndUpdate(
    { _id: id },
    shop,
    {
      new: true,
      runValidators: true,
    },
  )) as INotification | null;
  if (!notificationData) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      req.t('Failed to update notification'),
    );
  }
  return notificationData;
};
const updateManyNotificationFromDB = async (
  id: string,
  shop: INotification,
  req: Request,
): Promise<INotification | null> => {
  const isExist = await Notification.findById(id);
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, req.t('notification not found'));
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    !isExist?.userIds?.includes(req?.user?.userId)
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const notificationData = (await Notification.findOneAndUpdate(
    { _id: id },
    shop,
    {
      new: true,
      runValidators: true,
    },
  )) as INotification | null;
  if (!notificationData) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      req.t('Failed to update notification'),
    );
  }
  return notificationData;
};

const deleteNotificationFromDB = async (
  id: string,
  query: INotificationFilters,
  req: Request,
): Promise<INotification | null> => {
  const isExist = (await Notification.findById(id)) as INotification & {
    _id: Types.ObjectId;
  };
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, req.t('notification not found'));
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    !isExist?.userIds?.includes(req?.user?.userId)
  ) {
    throw new ApiError(403, 'forbidden access');
  }
  const result = await Notification.findByIdAndDelete(id);

  return result;
};

export const NotificationService = {
  createNotificationToDB,
  getAllNotificationsFromDB,
  updateNotificationFromDB,
  getSingleNotificationFromDB,
  deleteNotificationFromDB,
};
