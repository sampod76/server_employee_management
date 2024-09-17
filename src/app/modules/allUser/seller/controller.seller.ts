/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';

import httpStatus from 'http-status';
import { PAGINATION_FIELDS } from '../../../../global/constant/pagination';
import catchAsync from '../../../share/catchAsync';
import pick from '../../../share/pick';
import sendResponse from '../../../share/sendResponse';
import { sellerFilterableFields } from './constant.seller';
import { ISellerUser } from './interface.seller';
import { SellerService } from './service.seller';
import { IUserRef } from '../typesAndConst';

const createSeller = catchAsync(async (req: Request, res: Response) => {
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
  const result = await SellerService.createSeller(data, req);
  sendResponse<ISellerUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Seller created successfully',
    data: result,
  });
});

const getAllSellers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, sellerFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);
  const result = await SellerService.getAllSellersFromDB(
    filters,
    paginationOptions,
    req,
  );

  sendResponse<ISellerUser[]>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Get all Sellers',
    data: result.data,
    meta: result.meta,
  });
});

const updateSeller = catchAsync(async (req: Request, res: Response) => {
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

  const result = await SellerService.updateSellerFromDB(
    id,
    data,
    req.user as IUserRef,
    req,
  );
  sendResponse<ISellerUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Seller updated successfully',
    data: result,
  });
});

const getSingleSeller = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await SellerService.getSingleSellerFromDB(id, req);
  sendResponse<ISellerUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Seller find successfully',
    data: result,
  });
});

const deleteSeller = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await SellerService.deleteSellerFromDB(id, req.query, req);
  sendResponse<ISellerUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Seller deleted successfully',
    data: result,
  });
});

export const SellerController = {
  createSeller,
  getAllSellers,
  updateSeller,
  getSingleSeller,
  deleteSeller,
};
