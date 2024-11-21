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
import { GroupMemberFilterableFields } from './constants.groupUserMember';
import { IGroupMember } from './interface.groupUserMember';
import { GroupMemberService } from './service.groupUserMember';

const createGroupMember = catchAsync(async (req: Request, res: Response) => {
  req.body = {
    ...req.body,
    sender: RequestToRefUserObject(req.user as IUserRef),
  };
  const result = await GroupMemberService.createGroupMember(
    req.body,
    req?.user as IUserRef,
    req,
  );
  sendResponse<IGroupMember>(req, res, {
    statusCode: 200,
    success: true,
    message: 'GroupMember created successfully',
    data: result,
  });

  //--------------notification------
  const data: IServiceNotification<IGroupMember> = [
    {
      userId: result?.receiver?.userId?.toString(),
      message: `Get friend one request`,
      //@ts-ignore
      data: result,
    },
  ];
  sendNotificationFromDB<IGroupMember>(data);
  //-----------end-------------------
});
const checkUserIdToExistGroupMember = catchAsync(
  async (req: Request, res: Response) => {
    const result = await GroupMemberService.checkUserIdToExistGroupMemberFromDb(
      req.params?.id,
      req?.user as IUserRef,
      req,
    );
    sendResponse<IGroupMember>(req, res, {
      statusCode: 200,
      success: true,
      message: 'GroupMember get successfully',
      data: result,
    });
  },
);

//get all GroupMembers
const getAllGroupMembers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, GroupMemberFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);

  const result = await GroupMemberService.getAllGroupMembersFromDB(
    filters,
    paginationOptions,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'GroupMembers found successfully',
    data: result.data,
    meta: result.meta,
  });
});

//get a GroupMember by id
const getGroupMemberById = catchAsync(async (req: Request, res: Response) => {
  const result = await GroupMemberService.getSingleGroupMemberFromDB(
    req.params.id,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'GroupMember found successfully',
    data: result,
  });
});

//update GroupMember
const updateGroupMember = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  const result = await GroupMemberService.updateGroupMemberFromDB(
    req.params.id,
    req.body,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'GroupMember updated successfully',
    data: result,
  });
});
//update GroupMember
const updateGroupMemberBlock = catchAsync(
  async (req: Request, res: Response) => {
    // await RequestToFileDecodeAddBodyHandle(req);
    const result = await GroupMemberService.updateGroupMemberBlockFromDb(
      req.params.id,
      req.body,
      req,
    );

    sendResponse(req, res, {
      statusCode: 200,
      success: true,
      message: 'GroupMember updated successfully',
      data: result,
    });
  },
);
const updateGroupMemberListSort = catchAsync(
  async (req: Request, res: Response) => {
    // await RequestToFileDecodeAddBodyHandle(req);

    const result = await GroupMemberService.updateGroupMemberListSortFromDb(
      req.params.id,
      req.body,
      req,
    );

    sendResponse(req, res, {
      statusCode: 200,
      success: true,
      message: 'GroupMember updated successfully',
      data: result,
    });
  },
);

//delete GroupMember
const deleteGroupMember = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await GroupMemberService.deleteGroupMemberFromDB(
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

export const GroupMembersController = {
  createGroupMember,
  getAllGroupMembers,
  getGroupMemberById,
  updateGroupMember,
  deleteGroupMember,
  updateGroupMemberBlock,
  //
  checkUserIdToExistGroupMember,
  updateGroupMemberListSort,
};
