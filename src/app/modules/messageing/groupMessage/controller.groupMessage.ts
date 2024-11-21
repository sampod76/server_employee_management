import { Request, Response } from 'express';

import { PAGINATION_FIELDS } from '../../../../global/constant/pagination';
import catchAsync from '../../../share/catchAsync';
import pick from '../../../share/pick';
import sendResponse from '../../../share/sendResponse';
import { IUserRef } from '../../allUser/typesAndConst';
import { groupMessageFilterableFields } from './constants.groupMessage';
import { IGroupMessage } from './interface.groupMessage';
import { GroupMessageService } from './service.groupMessage';

const createGroupMessage = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);

  req.body = {
    ...req.body,
    sender: {
      role: req.user?.role,
      userId: req?.user?.userId,
      roleBaseUserId: req.user?.roleBaseUserId,
    },
  };
  const result = await GroupMessageService.createGroupMessage(req.body);
  sendResponse<IGroupMessage>(req, res, {
    statusCode: 200,
    success: true,
    message: 'GroupMessage created successfully',
    data: result,
  });
});

//get all GroupMessages
const getAllGroupMessages = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, groupMessageFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);

  const result = await GroupMessageService.getAllGroupMessagesFromDB(
    filters,
    paginationOptions,
    req.user as IUserRef & { id: string },
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'GroupMessages found successfully',
    data: result.data,
    meta: result.meta,
  });
});

//get a GroupMessage by id
const getGroupMessageById = catchAsync(async (req: Request, res: Response) => {
  const result = await GroupMessageService.getSingleGroupMessageFromDB(
    req.params.id,
    req.user as IUserRef & { userId: string },
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'GroupMessage found successfully',
    data: result,
  });
});

//update GroupMessage
const updateGroupMessage = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  const result = await GroupMessageService.updateGroupMessageFromDB(
    req.params.id,
    req.body,
    req?.user as IUserRef & { id: string },
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'GroupMessage updated successfully',
    data: result,
  });
});

//delete GroupMessage
const deleteGroupMessage = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await GroupMessageService.deleteGroupMessageFromDB(
    id,
    req.query,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'GroupMessage deleted successfully',
    data: result,
  });
});

export const GroupMessagesController = {
  createGroupMessage,
  getAllGroupMessages,
  getGroupMessageById,
  updateGroupMessage,
  deleteGroupMessage,
};
