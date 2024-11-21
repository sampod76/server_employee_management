/* eslint-disable @typescript-eslint/no-unused-vars */
import { PipelineStage, Schema, Types } from 'mongoose';
import { paginationHelper } from '../../../helper/paginationHelper';

import { IGenericResponse } from '../../interface/common';
import { IPaginationOption } from '../../interface/pagination';

import { Request } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { adminSetting_SEARCHABLE_FIELDS } from './consent.adminSetting';
import { IAdminSetting, IAdminSettingFilters } from './interface.adminSetting';
import { AdminSetting } from './model.adminSetting';

const createAdminSettingByDb = async (
  payload: IAdminSetting,
  req: Request,
): Promise<IAdminSetting | null> => {
  const findAlreadyExists = await AdminSetting.findOne({
    settingType: payload.settingType,
    isDelete: false,
  });
  //
  let result;
  if (findAlreadyExists) {
    result = await AdminSetting.findByIdAndUpdate(
      findAlreadyExists._id,
      payload,
      {
        new: true,
        runValidators: true,
      },
    );
  } else {
    result = await AdminSetting.create(payload);
  }
  return result;
};

//getAllAdminSettingFromDb
const getAllAdminSettingFromDb = async (
  filters: IAdminSettingFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<IAdminSetting[]>> => {
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
      $or: adminSetting_SEARCHABLE_FIELDS.map(field => ({
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

  // const result = await AdminSetting.find(whereConditions)
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

  // const result = await AdminSetting.aggregate(pipeline);
  // const total = await AdminSetting.countDocuments(whereConditions);
  //!-- alternatively and faster
  const pipeLineResult = await AdminSetting.aggregate([
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

// get single AdminSettinge form db
const getSingleAdminSettingFromDb = async (
  id: string,
  req: Request,
): Promise<IAdminSetting | null> => {
  const pipeline: PipelineStage[] = [
    { $match: { _id: new Types.ObjectId(id) } },
    ///***************** */ images field ******start
  ];
  const result = await AdminSetting.aggregate(pipeline);
  if (!result.length) {
    throw new ApiError(400, req.t('Not found AdminSetting'));
  }
  return result[0];
};

// update AdminSettinge form db
const updateAdminSettingFromDb = async (
  id: string,
  payload: Partial<IAdminSetting>,
  req: Request,
): Promise<IAdminSetting | null> => {
  const result = await AdminSetting.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });
  return result;
};

// delete AdminSettinge form db
const deleteAdminSettingByIdFromDb = async (
  id: string,
  query: IAdminSettingFilters,
  req: Request,
): Promise<IAdminSetting | null> => {
  const isExist = (await AdminSetting.findById(id)) as IAdminSetting & {
    _id: Schema.Types.ObjectId;
  };
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, req.t('AdminSetting not found'));
  }

  let result;
  if (query.delete == 'yes') {
    result = await AdminSetting.findByIdAndDelete(id);
    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, req.t('Failed to delete'));
    }
    return result;
  } else {
    result = await AdminSetting.findOneAndUpdate(
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

export const AdminSettingService = {
  createAdminSettingByDb,
  getAllAdminSettingFromDb,
  getSingleAdminSettingFromDb,
  updateAdminSettingFromDb,
  deleteAdminSettingByIdFromDb,
};
