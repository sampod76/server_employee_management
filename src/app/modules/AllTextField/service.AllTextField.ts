/* eslint-disable @typescript-eslint/no-unused-vars */
import { PipelineStage, Schema, Types } from 'mongoose';
import { paginationHelper } from '../../../helper/paginationHelper';

import { IGenericResponse } from '../../interface/common';
import { IPaginationOption } from '../../interface/pagination';

import { Request } from 'express';
import httpStatus from 'http-status';

import ApiError from '../../errors/ApiError';
import { ALL_TEXT_FIELD_SEARCHABLE_FIELDS } from './consent.AllTextField';
import { IAllTextField, IAllTextFieldFilters } from './interface.AllTextField';
import { AllTextField } from './model.AllTextField';

const createAllTextFieldByDb = async (
  payload: IAllTextField,
  req: Request,
): Promise<IAllTextField | null> => {
  const findData = await AllTextField.findOne({ dataType: payload.dataType });
  let result;
  if (findData) {
    result = await AllTextField.findByIdAndUpdate(findData._id, payload);
  } else {
    result = await AllTextField.create(payload);
  }
  return result;
};

//getAllAllTextFieldFromDb
const getAllAllTextFieldFromDb = async (
  filters: IAllTextFieldFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<IAllTextField[]>> => {
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
      $or: ALL_TEXT_FIELD_SEARCHABLE_FIELDS.map(field => ({
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

  // const result = await AllTextField.find(whereConditions)
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

  // console.log(pipeline);
  const result = await AllTextField.aggregate(pipeline);
  // console.log(result, 127);
  const total = await AllTextField.countDocuments(whereConditions);
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// get single AllTextFielde form db
const getSingleAllTextFieldFromDb = async (
  id: string,
  req: Request,
): Promise<IAllTextField | null> => {
  const pipeline: PipelineStage[] = [
    { $match: { _id: new Types.ObjectId(id) } },
    ///***************** */ images field ******start
  ];
  const result = await AllTextField.aggregate(pipeline);
  if (!result.length) {
    throw new ApiError(400, req.t(`Not found TextField`));
  }
  return result[0];
};

// update AllTextFielde form db
const updateAllTextFieldFromDb = async (
  id: string,
  payload: Partial<IAllTextField>,
  req: Request,
): Promise<IAllTextField | null> => {
  const result = await AllTextField.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });
  return result;
};

// delete AllTextFielde form db
const deleteAllTextFieldByIdFromDb = async (
  id: string,
  query: IAllTextFieldFilters,
  req: Request,
): Promise<IAllTextField | null> => {
  const isExist = (await AllTextField.findById(id)) as IAllTextField & {
    _id: Schema.Types.ObjectId;
  };
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, req.t('Not found TextField'));
  }

  let result;
  if (query.delete == 'yes') {
    result = await AllTextField.findByIdAndDelete(id);
    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, req.t('Failed to delete'));
    }
    return result;
  } else {
    result = await AllTextField.findOneAndUpdate(
      { _id: id },
      { isDelete: true },
    );
    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, req.t('Failed to delete'));
    }
    return result;
  }
};
//

export const AllTextFieldService = {
  createAllTextFieldByDb,
  getAllAllTextFieldFromDb,
  getSingleAllTextFieldFromDb,
  updateAllTextFieldFromDb,
  deleteAllTextFieldByIdFromDb,
};
