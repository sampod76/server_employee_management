/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';

import httpStatus from 'http-status';
import { PAGINATION_FIELDS } from '../../../../global/constant/pagination';
import catchAsync from '../../../share/catchAsync';
import pick from '../../../share/pick';
import sendResponse from '../../../share/sendResponse';
import { EmployeeFilterableFields } from './constant.employee';
import { IEmployeeUser } from './interface.employee';
import { EmployeeUserService } from './service.employee';

const createEmployeeUser = catchAsync(async (req: Request, res: Response) => {
  //-----------------------fil--upload--------------------------
  // await RequestToFileDecodeAddBodyHandle(req);
  //when single file upload. image:{} --> in the multer->fields-> in single file max:1
  /*  if (Array.isArray(req.body?.profileImage) && req.body?.profileImage?.length) {
    const singleImage = req.body?.profileImage[0];
    req.body = {
      ...req.body,
      profileImage: singleImage,
    };
  } */
  //----------------------------------------------------------------
  let data = req.body;
  if (req?.user?.userId) {
    const user = req.user;
    data = {
      ...data,
      author: {
        role: user?.role,
        userId: user?.userId,
        roleBaseUserId: user?.roleBaseUserId,
      },
    };
  }
  const result = await EmployeeUserService.createEmployeeUser(data, req);
  sendResponse<IEmployeeUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'EmployeeUser created successfully',
    data: result,
  });
});

const getAllEmployeeUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, EmployeeFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);
  const result = await EmployeeUserService.getAllEmployeeUsersFromDB(
    filters,
    paginationOptions,
    req,
  );

  sendResponse<IEmployeeUser[]>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Get all EmployeeUsers',
    data: result.data,
    meta: result.meta,
  });
});
const dashboard = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, EmployeeFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);
  const result = await EmployeeUserService.dashboardFromDb(
    filters,
    paginationOptions,
    req,
  );

  sendResponse<IEmployeeUser[]>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Get all EmployeeUsers',
    data: result,
  });
});

const updateEmployeeUser = catchAsync(async (req: Request, res: Response) => {
  //-----------------------fil--upload--------------------------
  // await RequestToFileDecodeAddBodyHandle(req);
  //when single file upload. image:{} --> in the multer->fields-> in single file max:1
  /*   if (Array.isArray(req.body?.profileImage) && req.body?.profileImage?.length) {
    const singleImage = req.body?.profileImage[0];
    req.body = {
      ...req.body,
      profileImage: singleImage,
    };
  } */
  //----------------------------------------------------------------
  const { password, role, authentication, ...data } = req.body;
  const id = req.params.id;

  const result = await EmployeeUserService.updateEmployeeUserFromDB(
    id,
    data,
    req,
  );
  sendResponse<IEmployeeUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'EmployeeUser updated successfully',
    data: result,
  });
});

const getSingleEmployeeUser = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await EmployeeUserService.getSingleEmployeeUserFromDB(
      id,
      req,
    );
    sendResponse<IEmployeeUser>(req, res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'EmployeeUser find successfully',
      data: result,
    });
  },
);

const deleteEmployeeUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await EmployeeUserService.deleteEmployeeUserFromDB(
    id,
    req.query,
    req,
  );
  sendResponse<IEmployeeUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'EmployeeUser deleted successfully',
    data: result,
  });
});

export const EmployeeUserController = {
  createEmployeeUser,
  getAllEmployeeUsers,
  updateEmployeeUser,
  getSingleEmployeeUser,
  deleteEmployeeUser,
  dashboard,
};
