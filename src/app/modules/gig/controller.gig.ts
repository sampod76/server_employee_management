import { Request, Response } from 'express';

import { PAGINATION_FIELDS } from '../../../global/constant/pagination';
import catchAsync from '../../share/catchAsync';
import pick from '../../share/pick';
import sendResponse from '../../share/sendResponse';
import { IUserRef } from '../allUser/typesAndConst';
import { RequestToRefUserObject } from '../allUser/user/user.utils';
import { GigFilterableFields } from './constants.gig';
import { IGig } from './interface.gig';
import { GigService } from './service.gig';

const createGig = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  // console.log('create Gig', req.body);
  req.body = {
    ...req.body,
    seller: RequestToRefUserObject(req.user as IUserRef),
  };
  const result = await GigService.createGig(req.body, req);
  sendResponse<IGig>(req, res, {
    statusCode: 200,
    success: true,
    message: 'Gig created successfully',
    data: result,
  });
});

//get all Gigs
const getAllGigs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, GigFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);

  const result = await GigService.getAllGigsFromDB(
    filters,
    paginationOptions,
    req.user as IUserRef,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Gigs found successfully',
    data: result.data,
    meta: result.meta,
  });
});

//get a Gig by id
const getGigById = catchAsync(async (req: Request, res: Response) => {
  const result = await GigService.getSingleGigFromDB(
    req.params.id,
    req.user as IUserRef,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Gig found successfully',
    data: result,
  });
});

//update Gig
const updateGig = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  const result = await GigService.updateGigFromDB(
    req.params.id,
    req.body,
    req.user as IUserRef,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Gig updated successfully',
    data: result,
  });
});

//delete Gig
const deleteGig = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await GigService.deleteGigFromDB(
    id,
    req.query,
    req.user as IUserRef,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Gig deleted successfully',
    data: result,
  });
});

export const GigsController = {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
};
