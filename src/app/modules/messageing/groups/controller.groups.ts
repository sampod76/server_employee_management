import { Request, Response } from 'express';

import { PAGINATION_FIELDS } from '../../../../global/constant/pagination';
import catchAsync from '../../../share/catchAsync';
import pick from '../../../share/pick';
import sendResponse from '../../../share/sendResponse';
import { IUserRef } from '../../allUser/typesAndConst';
import { RequestToRefUserObject } from '../../allUser/user/user.utils';
import {
  IServiceNotification,
  sendNotificationFromDB,
} from '../../notification/notification.utls';
import { GroupsFilterableFields } from './constants.groups';
import { IGroups } from './interface.groups';
import { GroupsService } from './service.groups';

const createGroups = catchAsync(async (req: Request, res: Response) => {
  let bodyData = req.body;
  bodyData = {
    ...req.body,
    author: RequestToRefUserObject(req.user as IUserRef),
  };
  if (Array.isArray(req.body?.profileImage) && req.body?.profileImage?.length) {
    bodyData['profileImage'] = req.body?.profileImage[0];
  }
  if (Array.isArray(req.body?.coverImage) && req.body?.coverImage?.length) {
    bodyData['coverImage'] = req.body?.coverImage[0];
  }
  const result = await GroupsService.createGroups(
    bodyData,
    req?.user as IUserRef,
    req,
  );
  sendResponse<IGroups>(req, res, {
    statusCode: 200,
    success: true,
    message: 'Groups created successfully',
    data: result,
  });

  //--------------notification------
  const data: IServiceNotification<IGroups> = [
    {
      userId: result?.author?.userId?.toString(),
      message: `Group request was successfully`,
      //@ts-ignore
      data: result,
    },
  ];
  sendNotificationFromDB<IGroups>(data);
  //-----------end-------------------
});
const checkUserIdToExistGroups = catchAsync(
  async (req: Request, res: Response) => {
    const result = await GroupsService.checkUserIdToExistGroupsFromDb(
      req.params?.id,
      req?.user as IUserRef,
      req,
    );
    sendResponse<IGroups>(req, res, {
      statusCode: 200,
      success: true,
      message: 'Groups get successfully',
      data: result,
    });
  },
);

//get all Groupss
const getAllGroupss = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, GroupsFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);

  const result = await GroupsService.getAllGroupssFromDB(
    filters,
    paginationOptions,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Groupss found successfully',
    data: result.data,
    meta: result.meta,
  });
});

//get a Groups by id
const getGroupsById = catchAsync(async (req: Request, res: Response) => {
  const result = await GroupsService.getSingleGroupsFromDB(req.params.id, req);

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Groups found successfully',
    data: result,
  });
});

//update Groups
const updateGroups = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  const result = await GroupsService.updateGroupsFromDB(
    req.params.id,
    req.body,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Groups updated successfully',
    data: result,
  });
});

const updateGroupsListSort = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);

  const result = await GroupsService.updateGroupsListSortFromDb(
    req.params.id,
    req.body,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Groups updated successfully',
    data: result,
  });
});

//delete Groups
const deleteGroups = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await GroupsService.deleteGroupsFromDB(id, req.query, req);

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'review deleted successfully',
    data: result,
  });
});

export const GroupssController = {
  createGroups,
  getAllGroupss,
  getGroupsById,
  updateGroups,
  deleteGroups,

  //
  checkUserIdToExistGroups,
  updateGroupsListSort,
};
