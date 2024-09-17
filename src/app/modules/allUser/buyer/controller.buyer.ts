/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';

import httpStatus from 'http-status';
import { PAGINATION_FIELDS } from '../../../../global/constant/pagination';
import catchAsync from '../../../share/catchAsync';
import pick from '../../../share/pick';
import sendResponse from '../../../share/sendResponse';
import { buyerFilterableFields } from './constant.buyer';
import { IBuyerUser } from './interface.buyer';
import { BuyerUserService } from './service.buyer';

const createBuyerUser = catchAsync(async (req: Request, res: Response) => {
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
  const result = await BuyerUserService.createBuyerUser(data, req);
  sendResponse<IBuyerUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'BuyerUser created successfully',
    data: result,
  });
});

const getAllBuyerUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, buyerFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);
  const result = await BuyerUserService.getAllBuyerUsersFromDB(
    filters,
    paginationOptions,
    req,
  );

  sendResponse<IBuyerUser[]>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Get all BuyerUsers',
    data: result.data,
    meta: result.meta,
  });
});

const updateBuyerUser = catchAsync(async (req: Request, res: Response) => {
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

  const result = await BuyerUserService.updateBuyerUserFromDB(id, data, req);
  sendResponse<IBuyerUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'BuyerUser updated successfully',
    data: result,
  });
});

const getSingleBuyerUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await BuyerUserService.getSingleBuyerUserFromDB(id, req);
  sendResponse<IBuyerUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'BuyerUser find successfully',
    data: result,
  });
});

const deleteBuyerUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await BuyerUserService.deleteBuyerUserFromDB(
    id,
    req.query,
    req,
  );
  sendResponse<IBuyerUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'BuyerUser deleted successfully',
    data: result,
  });
});

export const BuyerUserController = {
  createBuyerUser,
  getAllBuyerUsers,
  updateBuyerUser,
  getSingleBuyerUser,
  deleteBuyerUser,
};
