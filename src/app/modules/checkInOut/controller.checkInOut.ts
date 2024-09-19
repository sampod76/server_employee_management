import { Request, Response } from 'express';

import { PAGINATION_FIELDS } from '../../../global/constant/pagination';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import catchAsync from '../../share/catchAsync';
import pick from '../../share/pick';
import sendResponse from '../../share/sendResponse';
import { IUserRef, IUserRefAndDetails } from '../allUser/typesAndConst';
import { RequestToRefUserObject } from '../allUser/user/user.utils';
import { CheckInOutFilterableFields } from './constants.checkInOut';
import { ICheckInOut } from './interface.checkInOut';
import { CheckInOutService } from './service.checkInOut';

const createCheckInOut = catchAsync(async (req: Request, res: Response) => {
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
  const result = await CheckInOutService.createCheckInOut(
    req.body,
    req?.user as IUserRef,
    req,
  );
  sendResponse<ICheckInOut>(req, res, {
    statusCode: 200,
    success: true,
    message: 'CheckInOut created successfully',
    data: result,
  });
});

//get all CheckInOuts
const getAllCheckInOuts = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, CheckInOutFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);

  const result = await CheckInOutService.getAllCheckInOutsFromDB(
    filters,
    paginationOptions,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'CheckInOut found successfully',
    data: result.data,
    meta: result.meta,
  });
});

//get a CheckInOut by id
const getCheckInOutById = catchAsync(async (req: Request, res: Response) => {
  const result = await CheckInOutService.getSingleCheckInOutFromDB(
    req.params.id,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'CheckInOut found successfully',
    data: result,
  });
});

//update CheckInOut
const updateCheckInOut = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  const result = await CheckInOutService.updateCheckInOutFromDB(
    req.params.id,
    req.body,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'CheckInOut updated successfully',
    data: result,
  });
});

//delete CheckInOut
const deleteCheckInOut = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await CheckInOutService.deleteCheckInOutFromDB(
    id,
    req.query,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'CheckInOutD deleted successfully',
    data: result,
  });
});

export const CheckInOutController = {
  createCheckInOut,
  getAllCheckInOuts,
  getCheckInOutById,
  updateCheckInOut,
  deleteCheckInOut,
};
