import { Request, Response } from 'express';

import { PAGINATION_FIELDS } from '../../../global/constant/pagination';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import catchAsync from '../../share/catchAsync';
import pick from '../../share/pick';
import sendResponse from '../../share/sendResponse';
import { IUserRef, IUserRefAndDetails } from '../allUser/typesAndConst';
import { RequestToRefUserObject } from '../allUser/user/user.utils';
import { TaskManagementFilterableFields } from './constants.taskManagement';
import { ITaskManagement } from './interface.taskManagement';
import { TaskManagementService } from './service.taskManagement';

const createTaskManagement = catchAsync(async (req: Request, res: Response) => {
  req.body = {
    ...req.body,
    author: RequestToRefUserObject(req.user as IUserRefAndDetails),
  };
  if (req?.user?.role === ENUM_USER_ROLE.employee) {
    req.body = {
      ...req.body,
      employee: RequestToRefUserObject(req.user as IUserRefAndDetails),
    };
  }
  const result = await TaskManagementService.createTaskManagement(
    req.body,
    req?.user as IUserRef,
    req,
  );
  sendResponse<ITaskManagement>(req, res, {
    statusCode: 200,
    success: true,
    message: 'Task created successfully',
    data: result,
  });
});

//get all TaskManagements
const getAllTaskManagements = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, TaskManagementFilterableFields);
    const paginationOptions = pick(req.query, PAGINATION_FIELDS);

    const result = await TaskManagementService.getAllTaskManagementsFromDB(
      filters,
      paginationOptions,
      req,
    );

    sendResponse(req, res, {
      statusCode: 200,
      success: true,
      message: 'Task found successfully',
      data: result.data,
      meta: result.meta,
    });
  },
);

//get a TaskManagement by id
const getTaskManagementById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await TaskManagementService.getSingleTaskManagementFromDB(
      req.params.id,
      req,
    );

    sendResponse(req, res, {
      statusCode: 200,
      success: true,
      message: 'Task found successfully',
      data: result,
    });
  },
);

//update TaskManagement
const updateTaskManagement = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  const result = await TaskManagementService.updateTaskManagementFromDB(
    req.params.id,
    req.body,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Task updated successfully',
    data: result,
  });
});
const updateTaskProgress = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  const result = await TaskManagementService.updateTaskProgressFromDB(
    req.params.id,
    req.body,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Task updated successfully',
    data: result,
  });
});

//delete TaskManagement
const deleteTaskManagement = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await TaskManagementService.deleteTaskManagementFromDB(
    id,
    req.query,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'TaskD deleted successfully',
    data: result,
  });
});

export const TaskManagementController = {
  createTaskManagement,
  getAllTaskManagements,
  getTaskManagementById,
  updateTaskManagement,
  deleteTaskManagement,
  updateTaskProgress,
};
