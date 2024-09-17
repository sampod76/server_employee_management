/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { PAGINATION_FIELDS } from '../../../global/constant/pagination';
// import { globalImport } from '../../../import/global_Import';
// import ApiError from '../../errors/ApiError';
import catchAsync from '../../share/catchAsync';
import pick from '../../share/pick';
import sendResponse from '../../share/sendResponse';

import { adminSetting_FILTERABLE_FIELDS } from './consent.adminSetting';
import { IAdminSetting } from './interface.adminSetting';
import { AdminSettingService } from './service.adminSetting';

// import { z } from 'zod'
const createAdminSetting = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  // console.log(req.body);

  const result = await AdminSettingService.createAdminSettingByDb(
    req.body,
    req,
  );

  sendResponse<IAdminSetting>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successful create AdminSetting',
    data: result,
  });
  // next();
  /*
   res.status(200).send({
      success: true,
      data: result,
      message:('successfully create AdminSetting'),
    });
  */
});

const getAllAdminSetting = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, adminSetting_FILTERABLE_FIELDS);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);

  const result = await AdminSettingService.getAllAdminSettingFromDb(
    filters,
    paginationOptions,
    req,
  );

  sendResponse<IAdminSetting[]>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successfully Get all AdminSetting',
    meta: result.meta,
    data: result.data,
  });
  // next();
});

const getSingleAdminSetting = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    /*   if (!globalImport.ObjectId.isValid(id)) {
      throw new ApiError(400, 'invalid id sampod');
    } */

    const result = await AdminSettingService.getSingleAdminSettingFromDb(
      id,
      req,
    );

    /* if (!result) {
      throw new ApiError(400, 'No data found');
    } */
    sendResponse<IAdminSetting>(req, res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'successfully get AdminSetting',
      data: result,
    });
  },
);
const updateAdminSetting = catchAsync(async (req: Request, res: Response) => {
  //  await RequestToFileDecodeAddBodyHandle(req);
  const { id } = req.params;
  const updateData = req.body;

  const result = await AdminSettingService.updateAdminSettingFromDb(
    id,
    updateData,
    req,
  );

  sendResponse<IAdminSetting>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successfully update AdminSetting',
    data: result,
  });
});

const deleteAdminSetting = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AdminSettingService.deleteAdminSettingByIdFromDb(
    id,
    req.query,
    req,
  );
  sendResponse<IAdminSetting>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successfully delete AdminSetting',
    data: result,
  });
});
export const AdminSettingController = {
  createAdminSetting,
  getAllAdminSetting,
  getSingleAdminSetting,
  updateAdminSetting,
  deleteAdminSetting,
};
