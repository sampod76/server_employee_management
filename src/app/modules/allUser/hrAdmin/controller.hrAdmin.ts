/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';

import httpStatus from 'http-status';
import { PAGINATION_FIELDS } from '../../../../global/constant/pagination';
import catchAsync from '../../../share/catchAsync';
import pick from '../../../share/pick';
import sendResponse from '../../../share/sendResponse';
import { IUserRef } from '../typesAndConst';
import { HrAdminFilterableFields } from './constant.hrAdmin';

import { HrAdminService } from './service.hrAdmin';
import { IHrAdminUser } from './interface.hrAdmin';

const createHrAdmin = catchAsync(async (req: Request, res: Response) => {
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
  const result = await HrAdminService.createHrAdmin(data, req);
  sendResponse<IHrAdminUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'HrAdmin created successfully',
    data: result,
  });
});

const getAllHrAdmins = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, HrAdminFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);
  const result = await HrAdminService.getAllHrAdminsFromDB(
    filters,
    paginationOptions,
    req,
  );

  sendResponse<IHrAdminUser[]>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Get all HrAdmins',
    data: result.data,
    meta: result.meta,
  });
});

const updateHrAdmin = catchAsync(async (req: Request, res: Response) => {
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

  const result = await HrAdminService.updateHrAdminFromDB(
    id,
    data,
    req.user as IUserRef,
    req,
  );
  sendResponse<IHrAdminUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'HrAdmin updated successfully',
    data: result,
  });
});

const getSingleHrAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await HrAdminService.getSingleHrAdminFromDB(id, req);
  sendResponse<IHrAdminUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'HrAdmin find successfully',
    data: result,
  });
});

const deleteHrAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await HrAdminService.deleteHrAdminFromDB(id, req.query, req);
  sendResponse<IHrAdminUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'HrAdmin deleted successfully',
    data: result,
  });
});

export const HrAdminController = {
  createHrAdmin,
  getAllHrAdmins,
  updateHrAdmin,
  getSingleHrAdmin,
  deleteHrAdmin,
};
