/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import httpStatus from 'http-status';
import { PipelineStage, Schema, Types } from 'mongoose';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { paginationHelper } from '../../../helper/paginationHelper';
import ApiError from '../../errors/ApiError';
import { IGenericResponse } from '../../interface/common';
import { IPaginationOption } from '../../interface/pagination';

import { LookupAnyRoleDetailsReusable } from '../../../helper/lookUpResuable';

import { EmployeeUser } from '../allUser/employee/model.employee';
import { IUserRef } from '../allUser/typesAndConst';
import { CheckInOutSearchableFields } from './constants.checkInOut';
import { ICheckInOut, ICheckInOutFilters } from './interface.checkInOut';
import { CheckInOut } from './models.checkInOut';

const createCheckInFromDb = async (
  data: ICheckInOut,
  requestUser: IUserRef,
  req: Request,
): Promise<ICheckInOut | null> => {
  // console.log(data, 'data');
  // Set the time to the start of the current day (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if the user has already checked in today
  const existingCheckIn = (await CheckInOut.findOne({
    'employee.userId': requestUser.userId,
    checkInTime: { $gte: today },
    isDelete: false,
  })) as any;

  if (existingCheckIn) {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      'You already check in today.',
    );
  }

  const res = await CheckInOut.create(data);
  return res;
};
const createCheckOutFromDb = async (
  data: ICheckInOut,
  requestUser: IUserRef,
  req: Request,
): Promise<ICheckInOut | null> => {
  console.log(data, 'data');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingCheckIn = await CheckInOut.findOne({
    'employee.userId': requestUser.userId,
    checkInTime: { $gte: today, $lte: new Date().setHours(23, 59, 59, 999) },
    isDelete: false,
  });

  if (!existingCheckIn) {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      "You haven't check in today.",
    );
  } else if (existingCheckIn.checkOutTime) {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      'You already check out today.',
    );
  }

  const res = await CheckInOut.findByIdAndUpdate(
    existingCheckIn._id,
    { $push: { provide: data.provide }, checkOutTime: data.checkOutTime },
    {
      runValidators: true,
      new: true,
    },
  );
  return res;
};
const createAdminByCheckInOutFromDb = async (
  data: ICheckInOut,
  requestUser: IUserRef,
  req: Request,
): Promise<ICheckInOut | null> => {
  const today = new Date(data.checkInTime);
  today.setHours(0, 0, 0, 0);

  const get = new Date(data.checkInTime);
  get.setHours(23, 59, 59, 999);
  let id = '';
  if (typeof data.employee === 'string') {
    id = data.employee;
  } else {
    id = data?.employee?.roleBaseUserId.toString();
  }
  const findEmployee = await EmployeeUser.isEmployeeUserExistMethod(id, {
    populate: true,
  });
  data.employee = {
    roleBaseUserId: findEmployee._id,
    role: ENUM_USER_ROLE.employee,
    //@ts-ignore
    userId: findEmployee.userDetails._id,
  };
  const existingCheckIn = await CheckInOut.findOne({
    'employee.userId': new Types.ObjectId(data.employee.userId),
    checkInTime: {
      $gte: today,
      $lte: get,
    },
    isDelete: false,
  });

  // if (!existingCheckIn) {
  //   throw new ApiError(
  //     httpStatus.NOT_ACCEPTABLE,
  //     "You haven't check in today.",
  //   );
  // } else if (existingCheckIn.checkOutTime) {
  //   throw new ApiError(
  //     httpStatus.NOT_ACCEPTABLE,
  //     'You already check out today.',
  //   );
  // }
  let res = null;

  if (existingCheckIn) {
    res = await CheckInOut.findByIdAndUpdate(existingCheckIn._id, data, {
      runValidators: true,
      new: true,
    });
  } else {
    res = await CheckInOut.create(data);
  }

  return res;
};

const getAllCheckInOutsFromDB = async (
  filters: ICheckInOutFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<ICheckInOut[] | null>> => {
  const {
    searchTerm,
    createdAtFrom,
    createdAtTo,
    needProperty,
    ...filtersData
  } = filters;
  const userDetails = req.user as IUserRef;
  if (userDetails?.role === ENUM_USER_ROLE.employee) {
    filtersData.employeeUserId = userDetails.userId.toString();
  }
  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete == 'true'
      ? true
      : false
    : false;

  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      $or: CheckInOutSearchableFields.map((field: string) => ({
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
        } else if (field === 'checkInTime') {
          modifyFiled = {
            ['checkInTime']: { $gte: new Date(value) },
          };
        } else if (field === 'checkOutTime') {
          modifyFiled = {
            ['checkOutTime']: { $lte: new Date(value) },
          };
        } else if (field === 'isLate') {
          modifyFiled = {
            ['isLate']: value == 'true' ? true : false,
          };
        } else if (field === 'toDay') {
          modifyFiled = {
            checkInTime: {
              $gte: new Date().setHours(0, 0, 0, 0),
              $lte: new Date().setHours(23, 59, 59, 999),
            },
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
  const check = (await CheckInOut.findOne(whereConditions)) as ICheckInOut;
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
                { $isArray: '$details' },
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

    { $match: whereConditions },
    { $sort: sortConditions },
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
    //------employees lookups---------------

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
    CheckInOut.aggregate(pipeline),
    CheckInOut.countDocuments(whereConditions),
  ];
  const result = await Promise.all(resultArray);
  //!-- alternatively and faster
  /*
   const pipeLineResult = await CheckInOut.aggregate([
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
    data: result[0] as ICheckInOut[],
  };
};

const updateCheckInOutFromDB = async (
  id: string,
  data: ICheckInOut,
  req: Request,
): Promise<ICheckInOut | null> => {
  const isExist = (await CheckInOut.findOne({
    _id: id,
    isDelete: false,
  })) as ICheckInOut & {
    _id: Schema.Types.ObjectId;
  } as ICheckInOut;
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

  const updatedCheckInOut = await CheckInOut.findOneAndUpdate(
    { _id: id },
    data,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedCheckInOut) {
    throw new ApiError(400, 'Failed to update Task');
  }
  return updatedCheckInOut;
};

const getSingleCheckInOutFromDB = async (
  id: string,
  req?: Request,
): Promise<ICheckInOut | null> => {
  const user = await CheckInOut.isCheckInOutExistMethod(id, {
    populate: true,
  });

  return user;
};

const deleteCheckInOutFromDB = async (
  id: string,
  query: ICheckInOutFilters,
  req: Request,
): Promise<ICheckInOut | null> => {
  const isExist = (await CheckInOut.findOne({
    _id: id,
    isDelete: false,
  })) as ICheckInOut & {
    _id: Schema.Types.ObjectId;
  } as ICheckInOut;

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
    query.delete == 'yes' && // this is permanently delete but store trash collection
    (req?.user?.role == ENUM_USER_ROLE.admin ||
      req?.user?.role == ENUM_USER_ROLE.superAdmin)
  ) {
    data = await CheckInOut.findOneAndDelete({ _id: id });
  } else {
    data = await CheckInOut.findOneAndUpdate(
      { _id: id },
      { isDelete: true },
      { new: true, runValidators: true },
    );
  }

  return data;
};

export const CheckInOutService = {
  createCheckInFromDb,
  createCheckOutFromDb,
  getAllCheckInOutsFromDB,
  updateCheckInOutFromDB,
  getSingleCheckInOutFromDB,
  deleteCheckInOutFromDB,
  createAdminByCheckInOutFromDb,
};
