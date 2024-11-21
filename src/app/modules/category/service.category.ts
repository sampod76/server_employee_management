/* eslint-disable @typescript-eslint/no-unused-vars */
import { PipelineStage, Schema, Types } from 'mongoose';
import { paginationHelper } from '../../../helper/paginationHelper';

import { IGenericResponse } from '../../interface/common';
import { IPaginationOption } from '../../interface/pagination';

import { Request } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { CATEGORY_SEARCHABLE_FIELDS } from './consent.category';
import { ICategory, ICategoryFilters } from './interface.category';
import { Category } from './model.category';

const createCategoryByDb = async (
  payload: ICategory,
  req: Request,
): Promise<ICategory> => {
  const findAlreadyExists = await Category.findOne({
    title: payload.title,
    isDelete: false,
  });
  //

  if (findAlreadyExists) {
    throw new ApiError(400, 'This Category already Exist');
  }
  const result = await Category.create(payload);
  return result;
};

//getAllCategoryFromDb
const getAllCategoryFromDb = async (
  filters: ICategoryFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<ICategory[]>> => {
  //****************search and filters start************/
  const { searchTerm, ...filtersData } = filters;

  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete == 'true'
      ? true
      : false
    : false;
  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      $or: CATEGORY_SEARCHABLE_FIELDS.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  //****************search and filters end**********/

  //****************pagination start **************/
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  const sortConditions: { [key: string]: 1 | -1 } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
  }
  //****************pagination end ***************/

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  // const result = await Category.find(whereConditions)
  //   .populate('thumbnail')
  //   .sort(sortConditions)
  //   .skip(Number(skip))
  //   .limit(Number(limit));
  const pipeline: PipelineStage[] = [
    { $match: whereConditions },
    { $sort: sortConditions },
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
  ];

  // const result = await Category.aggregate(pipeline);
  // const total = await Category.countDocuments(whereConditions);
  //!-- alternatively and faster
  const pipeLineResult = await Category.aggregate([
    {
      $facet: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        data: pipeline,
        countDocuments: [
          {
            $match: whereConditions,
          },
          { $count: 'totalData' },
        ],
      },
    },
  ]);
  // Extract and format the pipeLineResults
  const total = pipeLineResult[0]?.countDocuments[0]?.totalData || 0; // Extract total count
  const result = pipeLineResult[0]?.data || []; // Extract data
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// get single Categorye form db
const getSingleCategoryFromDb = async (
  id: string,
  req: Request,
): Promise<ICategory | null> => {
  const pipeline: PipelineStage[] = [
    { $match: { _id: new Types.ObjectId(id) } },
    ///***************** */ images field ******start
  ];
  const result = await Category.aggregate(pipeline);
  if (!result.length) {
    throw new ApiError(400, 'Not found category');
  }
  return result[0];
};

// update Categorye form db
const updateCategoryFromDb = async (
  id: string,
  payload: Partial<ICategory>,
  req: Request,
): Promise<ICategory | null> => {
  const result = await Category.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });
  return result;
};

// delete Categorye form db
const deleteCategoryByIdFromDb = async (
  id: string,
  query: ICategoryFilters,
  req: Request,
): Promise<ICategory | null> => {
  const isExist = (await Category.findById(id)) as ICategory & {
    _id: Schema.Types.ObjectId;
  };
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  let result;
  if (query.delete == 'yes') {
    result = await Category.findByIdAndDelete(id);
    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Failed to delete');
    }
    return result;
  } else {
    result = await Category.findOneAndUpdate({ _id: id }, { isDelete: true });
    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Failed to delete');
    }
    return result;
  }
};
//

export const CategoryService = {
  createCategoryByDb,
  getAllCategoryFromDb,
  getSingleCategoryFromDb,
  updateCategoryFromDb,
  deleteCategoryByIdFromDb,
};
