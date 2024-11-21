/* eslint-disable @typescript-eslint/no-explicit-any */
import { SortOrder, Types } from 'mongoose';

import httpStatus from 'http-status';

import { Request } from 'express';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { paginationHelper } from '../../../helper/paginationHelper';
import ApiError from '../../errors/ApiError';
import { IGenericResponse } from '../../interface/common';
import { IPaginationOption } from '../../interface/pagination';
import { UserLoginHistorySearchableFields } from './loginHistory.constant';
import {
  IUserLoginHistory,
  IUserLoginHistoryFilters,
} from './loginHistory.interface';
import { UserLoginHistory } from './loginHistory.model';

const getAllUserLoginHistorys = async (
  filters: IUserLoginHistoryFilters,
  paginationOptions: IPaginationOption,
): Promise<IGenericResponse<IUserLoginHistory[]>> => {
  const { searchTerm, ...filtersData } = filters;
  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete == 'true'
      ? true
      : false
    : false;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      $or: UserLoginHistorySearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(
        //@ts-ignore
        ([field, value]: [keyof typeof filtersData, string]) => {
          let modifyFiled;
          if (field === 'user') {
            modifyFiled = {
              ['user']: new Types.ObjectId(value),
            };
          } else {
            modifyFiled = { [field]: value };
          }
          return modifyFiled;
        },
      ),
    });
  }

  const sortConditions: { [key: string]: SortOrder } = {};

  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder;
  }
  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  const result = await UserLoginHistory.find(whereConditions)
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await UserLoginHistory.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleUserLoginHistory = async (
  id: string,
): Promise<IUserLoginHistory | null> => {
  const result = await UserLoginHistory.findById({ _id: id });
  return result;
};

const updateUserLoginHistory = async (
  id: string,
  payload: Partial<IUserLoginHistory>,
): Promise<IUserLoginHistory | null> => {
  const isExist = await UserLoginHistory.findById({ _id: id });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'UserLoginHistory not found !');
  }

  const { ...UserLoginHistoryData } = payload;

  const updatedUserLoginHistoryData: Partial<IUserLoginHistory> = {
    ...UserLoginHistoryData,
  };

  const result = await UserLoginHistory.findOneAndUpdate(
    { _id: id },
    updatedUserLoginHistoryData,
    {
      new: true,
    },
  );
  return result;
};

const deleteUserLoginHistory = async (
  id: string,
  filter: IUserLoginHistoryFilters,
  req: Request,
): Promise<IUserLoginHistory | null> => {
  // check if the faculty is exist

  const isExist = await UserLoginHistory.findById({ _id: id });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'UserLoginHistory not found !');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    isExist?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }
  if (filter.delete === 'yes') {
    // await UserLoginHistory.findByIdAndDelete({ _id: id });
  } else {
    await UserLoginHistory.findByIdAndDelete({ _id: id });
    // await UserLoginHistory.findOneAndUpdate(
    //   { _id: id },
    //   {
    //     status: ENUM_STATUS.DEACTIVATE,
    //     isDelete: true,
    //   },
    // );
  }
  return null;
};

export const UserLoginHistoryService = {
  getAllUserLoginHistorys,
  getSingleUserLoginHistory,
  updateUserLoginHistory,
  deleteUserLoginHistory,
};
