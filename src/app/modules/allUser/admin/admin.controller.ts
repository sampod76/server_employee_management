/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';

import httpStatus from 'http-status';
import { PAGINATION_FIELDS } from '../../../../global/constant/pagination';
import catchAsync from '../../../share/catchAsync';
import pick from '../../../share/pick';
import sendResponse from '../../../share/sendResponse';
import { adminFilterableFields } from './admin.constant';
import { IAdmin } from './admin.interface';
import { AdminService } from './admin.service';

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  let data = req.body as IAdmin;
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
  const result = await AdminService.createAdmin(data, req);
  sendResponse<IAdmin>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin created successfully',
    data: result,
  });
});

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, adminFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);
  const result = await AdminService.getAllAdminsFromDB(
    filters,
    paginationOptions,
    req,
  );

  sendResponse<IAdmin[]>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Get all Admins',
    data: result.data,
    meta: result.meta,
  });
});

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  //  await RequestToFileDecodeAddBodyHandle(req);
  const { password, role, authentication, ...data } = req.body;
  const id = req.params.id;

  const result = await AdminService.updateAdminFromDB(id, data, req);
  sendResponse<IAdmin>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin updated successfully',
    data: result,
  });
});

const getSingleAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AdminService.getSingleAdminFromDB(id, req);
  sendResponse<IAdmin>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin find successfully',
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AdminService.deleteAdminFromDB(id, req.query, req);
  sendResponse<IAdmin>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin deleted successfully',
    data: result,
  });
});

export const AdminController = {
  createAdmin,
  getAllAdmins,
  updateAdmin,
  getSingleAdmin,
  deleteAdmin,
};
