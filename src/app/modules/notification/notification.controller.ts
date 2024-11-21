import { Request, Response } from 'express';

import { NotificationService } from './notification.service';

import httpStatus from 'http-status';
import { PAGINATION_FIELDS } from '../../../global/constant/pagination';

import catchAsync from '../../share/catchAsync';
import pick from '../../share/pick';
import sendResponse from '../../share/sendResponse';
import { Notification_FilterableFields } from './notification.constant';

import config from '../../../config';
import { INotification } from './notification.interface';

// import { ENUM_YN } from '../../../enums/globalEnums';

const createNotification = catchAsync(async (req: Request, res: Response) => {
  const bodyData = req.body as INotification;
  //if another shop kipper add another shop kipper user id. then validation but the admin can add any shop to user-id
  if (!req.file?.filename) {
    req.body.image = {
      url: config.logo,
    };
  }
  const result = await NotificationService.createNotificationToDB(
    bodyData,
    req,
  );

  // if (
  //   req.query.isSendNotification === true &&
  //   Array.isArray(result?.userIds) &&
  //   result?.userIds.length > 0
  // ) {
  //   sendNotificationFromDB(
  //     { multipleUser: result?.userIds as string[] },
  //     result,
  //   );
  // }

  sendResponse<INotification>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'notification create successfully',
    data: result,
  });
});

const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, Notification_FilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);
  const result = await NotificationService.getAllNotificationsFromDB(
    filters,
    paginationOptions,
  );
  sendResponse<INotification[]>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'notifications fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

const updateNotification = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const shop = req.body;
  const result = await NotificationService.updateNotificationFromDB(
    id,
    shop,
    req,
  );
  sendResponse<INotification>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'notification updated successfully',
    data: result,
  });
});

const getSingleNotification = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await NotificationService.getSingleNotificationFromDB(
      id,
      req,
    );
    sendResponse<INotification>(req, res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'notification fetched successfully',
      data: result,
    });
  },
);

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await NotificationService.deleteNotificationFromDB(
    id,
    req.query,
    req,
  );
  sendResponse<INotification>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'notification deleted successfully',
    data: result,
  });
});

export const NotificationController = {
  createNotification,
  getAllNotifications,
  updateNotification,
  getSingleNotification,
  deleteNotification,
};
