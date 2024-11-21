import { Request, Response } from 'express';

import { PAGINATION_FIELDS } from '../../../../global/constant/pagination';
import catchAsync from '../../../share/catchAsync';
import pick from '../../../share/pick';
import sendResponse from '../../../share/sendResponse';
import { IUserRef } from '../../allUser/typesAndConst';
import { messageFilterableFields } from './messages.constants';
import { IChatMessage } from './messages.interface';
import { ChatMessageService } from './messages.service';

const createChatMessage = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);

  req.body = {
    ...req.body,
    sender: {
      role: req.user?.role,
      userId: req?.user?.userId,
      roleBaseUserId: req.user?.roleBaseUserId,
    },
  };
  const result = await ChatMessageService.createChatMessage(req.body);
  sendResponse<IChatMessage>(req, res, {
    statusCode: 200,
    success: true,
    message: 'ChatMessage created successfully',
    data: result,
  });
});

//get all ChatMessages
const getAllChatMessages = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, messageFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);

  const result = await ChatMessageService.getAllChatMessagesFromDB(
    filters,
    paginationOptions,
    req.user as IUserRef & { id: string },
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'ChatMessages found successfully',
    data: result.data,
    meta: result.meta,
  });
});

//get a ChatMessage by id
const getChatMessageById = catchAsync(async (req: Request, res: Response) => {
  const result = await ChatMessageService.getSingleChatMessageFromDB(
    req.params.id,
    req.user as IUserRef & { userId: string },
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'ChatMessage found successfully',
    data: result,
  });
});

//update ChatMessage
const updateChatMessage = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  const result = await ChatMessageService.updateChatMessageFromDB(
    req.params.id,
    req.body,
    req?.user as IUserRef & { id: string },
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'ChatMessage updated successfully',
    data: result,
  });
});

//delete ChatMessage
const deleteChatMessage = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ChatMessageService.deleteChatMessageFromDB(
    id,
    req.query,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'review deleted successfully',
    data: result,
  });
});

export const ChatMessagesController = {
  createChatMessage,
  getAllChatMessages,
  getChatMessageById,
  updateChatMessage,
  deleteChatMessage,
};
