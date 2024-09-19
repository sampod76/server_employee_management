/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import httpStatus from 'http-status';
import { PipelineStage, Schema, Types } from 'mongoose';
import { ENUM_YN } from '../../../global/enum_constant_type';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { paginationHelper } from '../../../helper/paginationHelper';
import ApiError from '../../errors/ApiError';
import { IGenericResponse } from '../../interface/common';
import { IPaginationOption } from '../../interface/pagination';

import { LookupAnyRoleDetailsReusable } from '../../../helper/lookUpResuable';

import { IUserRef } from '../allUser/typesAndConst';

import {
  ENUM_LEAVE_MANAGEMENT_STATUS,
  ILeaveManagementStatus,
  LeaveManagementSearchableFields,
} from './constants.leaveManagement';
import {
  ILeaveManagement,
  ILeaveManagementFilters,
} from './interface.leaveManagement';
import { LeaveManagement } from './models.leaveManagement';

const createLeaveManagementFromDb = async (
  data: ILeaveManagement,
  requestUser: IUserRef,
  req: Request,
): Promise<ILeaveManagement | null> => {
  // Validate input data (optional but recommended)

  const userId = new Types.ObjectId(data.employee.userId);
  const fromDate = new Date(data.from);
  const toDate = new Date(data.to);

  if (fromDate > toDate) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      '`from` date cannot be after `to` date.',
    );
  }

  // Define the query to check for overlapping leaves
  const find = {
    'employee.userId': userId,
    isDelete: false,
    requestStatus: ENUM_LEAVE_MANAGEMENT_STATUS.approved,
    $or: [
      {
        from: { $lte: fromDate },
        to: { $gte: fromDate },
      },
      {
        from: { $lte: toDate },
        to: { $gte: toDate },
      },
      {
        from: { $gte: fromDate },
        to: { $lte: toDate },
      },
    ],
  };

  const existingCheckIn = await LeaveManagement.findOne(find);

  if (existingCheckIn) {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      'You are already leave requesting this date',
    );
  }

  const res = await LeaveManagement.create({
    ...data,
    totalLeaveDays:
      new Date(data.to).getDate() - new Date(data.from).getDate() + 1,
  });
  return res;
};

const getAllLeaveManagementsFromDB = async (
  filters: ILeaveManagementFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<ILeaveManagement[] | null>> => {
  const {
    searchTerm,
    createdAtFrom,
    createdAtTo,
    needProperty,
    ...filtersData
  } = filters;
  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete == 'true'
      ? true
      : false
    : false;

  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      $or: LeaveManagementSearchableFields.map((field: string) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filtersData).length) {
    const condition = Object.entries(filtersData).map(
      //@ts-ignore
      ([field, value]: [keyof typeof filtersData, string]) => {
        let modifyFiled;
        /* 
        if (field === 'userRoleBaseId' || field === 'referRoleBaseId') {
        modifyFiled = { [field]: new Types.ObjectId(value) };
        } else {
         modifyFiled = { [field]: value };
         } 
       */
        if (field === 'employeeUserId') {
          modifyFiled = {
            ['employee.userId']: new Types.ObjectId(value),
          };
        } else if (field === 'employeeRoleBaseId') {
          modifyFiled = {
            ['employee.roleBaseUserId']: new Types.ObjectId(value),
          };
        } else if (field === 'from') {
          modifyFiled = {
            ['from']: { $gte: new Date(value) },
          };
        } else if (field === 'to') {
          modifyFiled = {
            ['to']: { $lte: new Date(value) },
          };
        } else {
          modifyFiled = { [field]: value };
        }
        // console.log(modifyFiled);
        return modifyFiled;
      },
    );
    //
    if (createdAtFrom && !createdAtTo) {
      //only single data in register all data -> 2022-02-25_12:00 am to 2022-02-25_11:59 pm minutes
      const timeTo = new Date(createdAtFrom);
      const createdAtToModify = new Date(timeTo.setHours(23, 59, 59, 999));
      condition.push({
        //@ts-ignore
        createdAt: {
          $gte: new Date(createdAtFrom),
          $lte: new Date(createdAtToModify),
        },
      });
    } else if (createdAtFrom && createdAtTo) {
      condition.push({
        //@ts-ignore
        createdAt: {
          $gte: new Date(createdAtFrom),
          $lte: new Date(createdAtTo),
        },
      });
    }

    //
    andConditions.push({
      $and: condition,
    });
  }
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);
  const sortConditions: { [key: string]: 1 | -1 } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
  }

  //****************pagination end ***************/

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};
  //!------------check -access validation ------------------
  const check = (await LeaveManagement.findOne(
    whereConditions,
  )) as ILeaveManagement;
  if (check) {
    if (
      check?.employee?.userId?.toString() !== req?.user?.userId &&
      req?.user?.role !== ENUM_USER_ROLE.admin &&
      req?.user?.role !== ENUM_USER_ROLE.superAdmin
    ) {
      throw new ApiError(httpStatus.FORBIDDEN, 'forbidden access data');
    }
  }
  //!------------check -access validation ------------------
  const pipeline: PipelineStage[] = [
    { $match: whereConditions },
    { $sort: sortConditions },
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
    //------employees lookups---------------
    {
      $lookup: {
        from: 'employees',
        let: {
          id: '$employee.roleBaseUserId',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$id'],
              },
            },
          },
        ],
        as: 'details',
      },
    },
    {
      $addFields: {
        employee: {
          $cond: {
            if: {
              $and: [
                { isArray: '$details' },
                {
                  $eq: [
                    {
                      $size: '$details',
                    },
                    0,
                  ],
                },
              ],
            },
            then: '$employee',
            else: {
              $mergeObjects: [
                {
                  ['details']: {
                    $arrayElemAt: ['$details', 0],
                  },
                },
                '$employee',
              ],
            },
          },
        },
      },
    },
    {
      $project: { details: 0 },
    },
    //------end---------------
  ];

  //-----------------needProperty--lookup--------------------
  if (needProperty?.toLowerCase()?.includes('author')) {
    const collections = [];
    collections.push({
      roleMatchFiledName: 'author.role',
      idFiledName: 'author.roleBaseUserId', //$sender.roleBaseUserId
      pipeLineMatchField: '_id', //$_id
      outPutFieldName: 'details',
      margeInField: 'author',
    });
    LookupAnyRoleDetailsReusable(pipeline, {
      collections: collections,
    });
  }

  const resultArray = [
    LeaveManagement.aggregate(pipeline),
    LeaveManagement.countDocuments(whereConditions),
  ];
  const result = await Promise.all(resultArray);
  //!-- alternatively and faster
  /*
   const pipeLineResult = await LeaveManagement.aggregate([
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
  */
  return {
    meta: {
      page,
      limit,
      total: result[1] as number,
    },
    data: result[0] as ILeaveManagement[],
  };
};

const updateLeaveManagementFromDB = async (
  id: string,
  data: ILeaveManagement,
  req: Request,
): Promise<ILeaveManagement | null> => {
  const isExist = (await LeaveManagement.findOne({
    _id: id,
    isDelete: false,
  })) as ILeaveManagement & {
    _id: Schema.Types.ObjectId;
  } as ILeaveManagement;
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.employee?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const updatedLeaveManagement = await LeaveManagement.findOneAndUpdate(
    { _id: id },
    data,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedLeaveManagement) {
    throw new ApiError(400, 'Failed to update Task');
  }
  return updatedLeaveManagement;
};
const approvedDeclinedlLeaveManagementFromDB = async (
  id: string,
  data: { requestStatus: ILeaveManagementStatus },
  req: Request,
): Promise<ILeaveManagement | null> => {
  if (!data.requestStatus) {
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Request status is required');
  }
  const isExist = (await LeaveManagement.findOne({
    _id: id,
    isDelete: false,
  })) as ILeaveManagement & {
    _id: Schema.Types.ObjectId;
  } as ILeaveManagement;

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin
    // && isExist?.employee?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }
  if (isExist.requestStatus !== ENUM_LEAVE_MANAGEMENT_STATUS.pending) {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      `Leave status can not be changed. Because it is already ${isExist.requestStatus}`,
    );
  }

  const updatedLeaveManagement = await LeaveManagement.findOneAndUpdate(
    { _id: id },
    { requestStatus: data.requestStatus },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedLeaveManagement) {
    throw new ApiError(400, 'Failed to update Task');
  }
  return updatedLeaveManagement;
};

const getSingleLeaveManagementFromDB = async (
  id: string,
  req?: Request,
): Promise<ILeaveManagement | null> => {
  const leave = await LeaveManagement.isLeaveManagementExistMethod(id, {
    populate: true,
  });
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    leave?.employee?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  return leave;
};

const deleteLeaveManagementFromDB = async (
  id: string,
  query: ILeaveManagementFilters,
  req: Request,
): Promise<ILeaveManagement | null> => {
  const isExist = (await LeaveManagement.findOne({
    _id: id,
    isDelete: false,
  })) as ILeaveManagement & {
    _id: Schema.Types.ObjectId;
  } as ILeaveManagement;

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin
    // && isExist?.employee?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  let data;

  if (
    query.delete == ENUM_YN.YES && // this is permanently delete but store trash collection
    (req?.user?.role == ENUM_USER_ROLE.admin ||
      req?.user?.role == ENUM_USER_ROLE.superAdmin)
  ) {
    data = await LeaveManagement.findOneAndDelete({ _id: id });
  } else {
    data = await LeaveManagement.findOneAndUpdate(
      { _id: id },
      { isDelete: true },
      { new: true, runValidators: true },
    );
  }

  return data;
};

export const LeaveManagementService = {
  createLeaveManagementFromDb,
  approvedDeclinedlLeaveManagementFromDB,
  getAllLeaveManagementsFromDB,
  updateLeaveManagementFromDB,
  getSingleLeaveManagementFromDB,
  deleteLeaveManagementFromDB,
};
