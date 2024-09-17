/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { PAGINATION_FIELDS } from '../../../global/constant/pagination';
// import { globalImport } from '../../../import/global_Import';
// import ApiError from '../../errors/ApiError';
import catchAsync from '../../share/catchAsync';
import pick from '../../share/pick';
import sendResponse from '../../share/sendResponse';

import { CATEGORY_FILTERABLE_FIELDS } from './consent.category';
import { ICategory } from './interface.category';
import { CategoryService } from './service.category';

// import { z } from 'zod'
const createCategory = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  // console.log(req.body);

  const result = await CategoryService.createCategoryByDb(req.body, req);

  sendResponse<ICategory>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successful create category',
    data: result,
  });
  // next();
  /*
   res.status(200).send({
      success: true,
      data: result,
      message:('successfully create category'),
    });
  */
});

const getAllCategory = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, CATEGORY_FILTERABLE_FIELDS);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);

  const result = await CategoryService.getAllCategoryFromDb(
    filters,
    paginationOptions,
    req,
  );

  sendResponse<ICategory[]>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successfully Get all category',
    meta: result.meta,
    data: result.data,
  });
  // next();
});

const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  /*   if (!globalImport.ObjectId.isValid(id)) {
      throw new ApiError(400, 'invalid id sampod');
    } */

  const result = await CategoryService.getSingleCategoryFromDb(id, req);

  /* if (!result) {
      throw new ApiError(400, 'No data found');
    } */
  sendResponse<ICategory>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successfully get category',
    data: result,
  });
});
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  //  await RequestToFileDecodeAddBodyHandle(req);
  const { id } = req.params;
  const updateData = req.body;

  const result = await CategoryService.updateCategoryFromDb(
    id,
    updateData,
    req,
  );

  sendResponse<ICategory>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successfully update category',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryService.deleteCategoryByIdFromDb(
    id,
    req.query,
    req,
  );
  sendResponse<ICategory>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successfully delete category',
    data: result,
  });
});
export const CategoryController = {
  createCategory,
  getAllCategory,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
