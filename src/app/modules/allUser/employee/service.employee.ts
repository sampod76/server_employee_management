import { Types } from 'mongoose';
/* eslint-disable @typescript-eslint/no-unused-vars */
import bcrypt from 'bcrypt';
import { Request } from 'express';
import httpStatus from 'http-status';
import mongoose, { PipelineStage, Schema } from 'mongoose';

import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import { paginationHelper } from '../../../../helper/paginationHelper';
import ApiError from '../../../errors/ApiError';
import { IGenericResponse } from '../../../interface/common';
import { IPaginationOption } from '../../../interface/pagination';

import { LookupReusable } from '../../../../helper/lookUpResuable';
import { CheckInOut } from '../../checkInOut/models.checkInOut';
import { LeaveManagement } from '../../leaveManagment/models.leaveManagement';
import { TaskManagement } from '../../taskManagement/models.taskManagement';
import { ENUM_VERIFY } from '../typesAndConst';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { EmployeeSearchableFields } from './constant.employee';
import { IEmployeeUser, IEmployeeUserFilters } from './interface.employee';
import { EmployeeUser } from './model.employee';

const createEmployeeUser = async (
  data: IEmployeeUser,
  req?: Request,
): Promise<IEmployeeUser | null> => {
  const res = await EmployeeUser.create(data);
  return res;
};

const getAllEmployeeUsersFromDB = async (
  filters: IEmployeeUserFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<IEmployeeUser[] | null>> => {
  const { searchTerm, needProperty, ...filtersData } = filters;
  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete == 'true'
      ? true
      : false
    : false;
  filtersData.verify = filtersData.verify
    ? filtersData.verify
    : ENUM_VERIFY.ACCEPT;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      $or: EmployeeSearchableFields.map((field: string) => ({
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
          /* 
        if (field === 'userRoleBaseId' || field === 'referRoleBaseId') {
          modifyFiled = { [field]: new Types.ObjectId(value) };
        } else {
          modifyFiled = { [field]: value };
        } 
        */
          if (field === 'authorRoleBaseId') {
            modifyFiled = {
              ['author.roleBaseUserId']: new Types.ObjectId(value),
            };
          } else {
            modifyFiled = { [field]: value };
          }
          return modifyFiled;
        },
      ),
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

  const pipeline: PipelineStage[] = [
    { $match: whereConditions },
    { $sort: sortConditions },
    { $project: { password: 0 } },
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
  ];
  LookupReusable(pipeline, {
    collections: [
      {
        connectionName: 'users',
        idFiledName: 'email',
        pipeLineMatchField: 'email',
        outPutFieldName: 'userDetails',
        project: { password: 0 },
      },
    ],
  });

  // const result = await EmployeeUser.aggregate(pipeline);
  // const total = await EmployeeUser.countDocuments(whereConditions);
  //!-- alternatively and faster
  const pipeLineResult = await EmployeeUser.aggregate([
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
const dashboardFromDb = async (
  filters: any,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<any> => {
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

  const toDayCheckInOut = CheckInOut.countDocuments({
    isDelete: false,
    // checkInTime: {
    //   $gte: startOfDay,
    //   $lte: endOfDay,
    // },
    ['employee.userId']: new Types.ObjectId(req?.user?.userId as string),
  });

  const leaveRequest = LeaveManagement.aggregate([
    {
      $match: {
        isDelete: false,
        ['employee.userId']: new Types.ObjectId(req?.user?.userId as string),
        // requestStatus: ENUM_LEAVE_MANAGEMENT_STATUS.pending,
      },
    },
    {
      $group: {
        _id: '$requestStatus',
        total: { $sum: 1 },
      },
    },
  ]);
  const taskMange = TaskManagement.aggregate([
    {
      $match: {
        isDelete: false,
        ['employee.userId']: new Types.ObjectId(req?.user?.userId as string),
        // requestStatus: ENUM_LEAVE_MANAGEMENT_STATUS.pending,
      },
    },
    {
      $group: {
        _id: '$taskProgressStatus',
        total: { $sum: 1 },
      },
    },
  ]);

  const resolve = await Promise.all([toDayCheckInOut, leaveRequest, taskMange]);

  const dashboard = {
    toDayCheckInOut: resolve[0],
    leaveRequest: resolve[1],
    taskMange: resolve[2],
  };

  return {
    totalCheckInOffice: dashboard?.toDayCheckInOut || 0,
    totalApprovedLeaves:
      dashboard?.leaveRequest?.find(
        (leave: { _id: string }) => leave._id === 'approved',
      )?.total || 0,
    totalPendingLeaves:
      dashboard?.leaveRequest?.find(
        (leave: { _id: string }) => leave._id === 'pending',
      )?.total || 0,
    totalDoneTasks:
      dashboard?.taskMange?.find((task: { _id: string }) => task._id === 'done')
        ?.total || 0,
    totalToDoTasks:
      dashboard?.taskMange?.find((task: { _id: string }) => task._id === 'toDo')
        ?.total || 0,
    totalInProgressTasks:
      dashboard?.taskMange?.find(
        (task: { _id: string }) => task._id === 'inProgress',
      )?.total || 0,
  };
};

const updateEmployeeUserFromDB = async (
  id: string,
  data: IEmployeeUser,
  req: Request,
): Promise<IEmployeeUser | null> => {
  const isExist = (await EmployeeUser.findById(id)) as IEmployeeUser & {
    _id: Schema.Types.ObjectId;
  };
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'EmployeeUser not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?._id?.toString() !== req?.user?.roleBaseUserId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { name, address, ...EmployeeUserData } = data;
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin
  ) {
    delete (EmployeeUserData as Partial<IEmployeeUser>)['isDelete']; // remove it because , any user update time to not update this field , when user apply delete route to modify this field
    delete (EmployeeUserData as Partial<IEmployeeUser>)['email'];
    delete (EmployeeUserData as Partial<IEmployeeUser>)['userUniqueId'];
    delete (EmployeeUserData as Partial<IEmployeeUser>)['verify'];
  }
  const updatedEmployeeUserData: Partial<IEmployeeUser> = {
    ...EmployeeUserData,
  };

  if (address && Object.keys(address).length) {
    Object.keys(address).forEach(key => {
      const nameKey = `address.${key}` as keyof Partial<IEmployeeUser>;
      (updatedEmployeeUserData as any)[nameKey] =
        address[key as keyof typeof address];
    });
  }
  if (name && Object.keys(name).length) {
    Object.keys(name).forEach(key => {
      const nameKey = `name.${key}` as keyof Partial<IEmployeeUser>;
      (updatedEmployeeUserData as any)[nameKey] =
        name[key as keyof typeof name];
    });
  }
  const updatedEmployeeUser = await EmployeeUser.findOneAndUpdate(
    { _id: id },
    updatedEmployeeUserData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedEmployeeUser) {
    throw new ApiError(400, 'Failed to update EmployeeUser');
  }
  return updatedEmployeeUser;
};

const getSingleEmployeeUserFromDB = async (
  id: string,
  req: Request,
): Promise<IEmployeeUser | null> => {
  const user = await EmployeeUser.isEmployeeUserExistMethod(id, {
    populate: true,
  });

  return user;
};

const deleteEmployeeUserFromDB = async (
  id: string,
  query: IEmployeeUserFilters,
  req: Request,
): Promise<IEmployeeUser | null> => {
  // const isExist = (await EmployeeUser.findById(id).select('+password')) as IEmployeeUser & {
  //   _id: Schema.Types.ObjectId;
  // };
  const isExist = await EmployeeUser.aggregate([
    { $match: { _id: new Types.ObjectId(id), isDelete: false } },
  ]);

  if (!isExist.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'EmployeeUser not found');
  }

  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    isExist[0]?._id?.toString() !== req?.user?.roleBaseUserId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  //---- if user when delete you account then give his password
  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin
  ) {
    if (
      isExist[0].password &&
      !(await bcrypt.compare(req.body?.password, isExist[0].password))
    ) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Password is incorrect');
    }
  }

  let data;

  if (
    query.delete == 'yes' && // this is permanently delete but store trash collection
    (req?.user?.role == ENUM_USER_ROLE.admin ||
      req?.user?.role == ENUM_USER_ROLE.superAdmin)
  ) {
    // data = await EmployeeUser.findOneAndDelete({ _id: id });
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      data = await EmployeeUser.findOneAndDelete({ _id: id });
      // console.log('🚀 ~ data:', data);
      if (!data?.email) {
        throw new ApiError(400, 'Felid to delete EmployeeUser');
      }
      const deleteUser = (await User.findOneAndDelete({
        email: isExist[0].email,
      })) as IUser;
      if (!deleteUser?.email) {
        throw new ApiError(400, 'Felid to delete EmployeeUser');
      }
      await session.commitTransaction();
      await session.endSession();
    } catch (error: any) {
      await session.abortTransaction();
      await session.endSession();
      throw new ApiError(error?.statusCode || 400, error?.message);
    }
  } else {
    // data = await EmployeeUser.findOneAndUpdate(
    //   { _id: id },
    //   { isDelete: true },
    //   { new: true, runValidators: true },
    // );

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      data = await EmployeeUser.findOneAndUpdate(
        { _id: id },
        { isDelete: true },
        { new: true, runValidators: true, session },
      );
      // console.log('🚀 ~ data:', data);
      if (!data?.email) {
        throw new ApiError(400, 'Felid to delete EmployeeUser');
      }
      const deleteUser = await User.findOneAndUpdate(
        { email: isExist[0].email },
        { isDelete: true },
        { new: true, runValidators: true, session },
      );
      if (!deleteUser?.email) {
        throw new ApiError(400, 'Felid to delete EmployeeUser');
      }
      await session.commitTransaction();
      await session.endSession();
    } catch (error: any) {
      await session.abortTransaction();
      await session.endSession();
      throw new ApiError(error?.statusCode || 400, error?.message);
    }
  }
  return data;
};

export const EmployeeUserService = {
  createEmployeeUser,
  getAllEmployeeUsersFromDB,
  updateEmployeeUserFromDB,
  getSingleEmployeeUserFromDB,
  deleteEmployeeUserFromDB,
  dashboardFromDb,
};
