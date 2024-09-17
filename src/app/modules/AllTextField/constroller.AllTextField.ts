/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { PAGINATION_FIELDS } from '../../../global/constant/pagination';
// import { globalImport } from '../../../import/global_Import';
// import ApiError from '../../errors/ApiError';
import catchAsync from '../../share/catchAsync';
import pick from '../../share/pick';
import sendResponse from '../../share/sendResponse';

import { ALL_TEXT_FIELD_FILTERABLE_FIELDS } from './consent.AllTextField';
import { IAllTextField } from './interface.AllTextField';
import { AllTextFieldService } from './service.AllTextField';

// import { z } from 'zod'
const createAllTextField = catchAsync(async (req: Request, res: Response) => {
  //  await RequestToFileDecodeAddBodyHandle(req);

  const result = await AllTextFieldService.createAllTextFieldByDb(
    req.body,
    req,
  );

  sendResponse<IAllTextField>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successfully create TextField',
    data: result,
  });
  // next();
  /* res.status(200).send({
      success: true,
      data: result,
      message: 'successfully create TextField',
    }); */
});

const getAllAllTextField = catchAsync(async (req: Request, res: Response) => {
  //****************search and filter start******* */
  let queryObject = req.query;
  queryObject = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(queryObject).filter(([_, value]) => Boolean(value)),
  );
  const filters = pick(queryObject, ALL_TEXT_FIELD_FILTERABLE_FIELDS);

  //****************pagination start************ */

  const paginationOptions = pick(queryObject, PAGINATION_FIELDS);

  const result = await AllTextFieldService.getAllAllTextFieldFromDb(
    filters,
    paginationOptions,
    req,
  );

  sendResponse<IAllTextField[]>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successfully Get all TextField',
    meta: result.meta,
    data: result.data,
  });
  // next();
});

const getSingleAllTextField = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    /*   if (!globalImport.ObjectId.isValid(id)) {
      throw new ApiError(400, 'invalid id sampod');
    } */

    const result = await AllTextFieldService.getSingleAllTextFieldFromDb(
      id,
      req,
    );

    /* if (!result) {
      throw new ApiError(400, 'No data found');
    } */
    sendResponse<IAllTextField>(req, res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'successfully get TextField',
      data: result,
    });
  },
);
const updateAllTextField = catchAsync(async (req: Request, res: Response) => {
  //  await RequestToFileDecodeAddBodyHandle(req);
  const { id } = req.params;
  const updateData = req.body;

  const result = await AllTextFieldService.updateAllTextFieldFromDb(
    id,
    updateData,
    req,
  );

  sendResponse<IAllTextField>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successfully update TextField',
    data: result,
  });
});

const deleteAllTextField = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AllTextFieldService.deleteAllTextFieldByIdFromDb(
    id,
    req.query,
    req,
  );
  sendResponse<IAllTextField>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successfully delete TextField',
    data: result,
  });
});
export const AllTextFieldController = {
  createAllTextField,
  getAllAllTextField,
  getSingleAllTextField,
  updateAllTextField,
  deleteAllTextField,
};
