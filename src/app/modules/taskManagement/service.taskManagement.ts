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

import {
  LookupAnyRoleDetailsReusable,
  LookupReusable,
} from '../../../helper/lookUpResuable';

import { EmployeeUser } from '../allUser/employee/model.employee';
import { IUserRef } from '../allUser/typesAndConst';
import { TaskManagementSearchableFields } from './constants.taskManagement';
import {
  ITaskManagement,
  ITaskManagementFilters,
} from './interface.taskManagement';
import { TaskManagement } from './models.taskManagement';

const createTaskManagement = async (
  data: ITaskManagement,
  requestUser: IUserRef,
  req: Request,
): Promise<ITaskManagement | null> => {
  // console.log(data, 'data');
  if (requestUser.role === ENUM_USER_ROLE.admin) {
    if (!data.employee) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Employee field is required');
    }
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
    // data.taskList = data?.taskList?.map(task => ({
    //   title: task.title,
    //   uuid: uuidGenerator(),
    // }));
    console.log(data);
  }
  const res = await TaskManagement.create(data);
  return res;
};

const getAllTaskManagementsFromDB = async (
  filters: ITaskManagementFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<ITaskManagement[] | null>> => {
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
      $or: TaskManagementSearchableFields.map((field: string) => ({
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
        if (field === 'authorUserId') {
          modifyFiled = {
            ['author.userId']: new Types.ObjectId(value),
          };
        } else if (field === 'authorRoleBaseId') {
          modifyFiled = {
            ['author.roleBaseUserId']: new Types.ObjectId(value),
          };
        } else if (field === 'employeeUserId') {
          modifyFiled = {
            ['employee.userId']: new Types.ObjectId(value),
          };
        } else if (field === 'employeeRoleBaseId') {
          modifyFiled = {
            ['employee.roleBaseUserId']: new Types.ObjectId(value),
          };
        } else if (field === 'startDate') {
          modifyFiled = {
            ['startDate']: { $gte: new Date(value) },
          };
        } else if (field === 'endDate') {
          modifyFiled = {
            ['endDate']: { $lte: new Date(value) },
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
  const check = (await TaskManagement.findOne(
    whereConditions,
  )) as ITaskManagement;
  if (check) {
    if (
      check?.author?.userId?.toString() !== req?.user?.userId &&
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
    { $match: whereConditions },
    { $sort: sortConditions },
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
    //----------employees-lookups---------------
    // {
    //   $lookup: {
    //     from: 'employees',
    //     let: {
    //       id: '$employee.roleBaseUserId',
    //     },
    //     pipeline: [
    //       {
    //         $match: {
    //           $expr: {
    //             $eq: ['$_id', '$$id'],
    //           },
    //         },
    //       },
    //     ],
    //     as: 'details',
    //   },
    // },
    // {
    //   $addFields: {
    //     employee: {
    //       $cond: {
    //         if: {
    //           $and: [
    //             { isArray: '$details' },
    //             {
    //               $eq: [
    //                 {
    //                   $size: '$details',
    //                 },
    //                 0,
    //               ],
    //             },
    //           ],
    //         },
    //         then: '$employee',
    //         else: {
    //           $mergeObjects: [
    //             {
    //               ['details']: {
    //                 $arrayElemAt: ['$details', 0],
    //               },
    //             },
    //             '$employee',
    //           ],
    //         },
    //       },
    //     },
    //   },
    // },
    // {
    //   $project: { details: 0 },
    // },
    // {
    //   $lookup: {
    //     from: 'employees',
    //     let: {
    //       id: '$employee.roleBaseUserId',
    //     },
    //     pipeline: [
    //       {
    //         $match: {
    //           $expr: {
    //             $eq: ['$_id', '$$id'],
    //           },
    //         },
    //       },
    //     ],
    //     as: 'details',
    //   },
    // },
    // {
    //   $addFields: {
    //     employee: {
    //       $cond: {
    //         if: {
    //           $and: [
    //             { isArray: '$details' },
    //             {
    //               $eq: [
    //                 {
    //                   $size: '$details',
    //                 },
    //                 0,
    //               ],
    //             },
    //           ],
    //         },
    //         then: '$employee',
    //         else: {
    //           $mergeObjects: [
    //             {
    //               ['details']: {
    //                 $arrayElemAt: ['$details', 0],
    //               },
    //             },
    //             '$employee',
    //           ],
    //         },
    //       },
    //     },
    //   },
    // },
    // {
    //   $project: { details: 0 },
    // },
    // -------------end---------------
  ];

  //-----------------needProperty--lookup--------------------

  const collections = [];
  collections.push({
    roleMatchFiledName: 'author.role',
    idFiledName: '$author.roleBaseUserId', //$author.roleBaseUserId
    pipeLineMatchField: '$_id', //$_id
    outPutFieldName: 'details',
    margeInField: 'author',
  });

  LookupAnyRoleDetailsReusable(pipeline, {
    collections: collections,
  });

  LookupReusable(pipeline, {
    collections: [
      {
        connectionName: 'projects',
        idFiledName: '$projectId',
        pipeLineMatchField: '$_id',
        outPutFieldName: 'projectDetails',
      },
    ],
  });

  const resultArray = [
    TaskManagement.aggregate(pipeline),
    TaskManagement.countDocuments(whereConditions),
  ];
  const result = await Promise.all(resultArray);

  return {
    meta: {
      page,
      limit,
      total: result[1] as number,
    },
    data: result[0] as ITaskManagement[],
  };
};

const updateTaskManagementFromDB = async (
  id: string,
  data: ITaskManagement,
  req: Request,
): Promise<ITaskManagement | null> => {
  const isExist = (await TaskManagement.findOne({
    _id: id,
    isDelete: false,
  })) as ITaskManagement & {
    _id: Schema.Types.ObjectId;
  } as ITaskManagement;
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.author?.userId?.toString() !== req?.user?.userId
    // && isExist?.employee?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  let employeeId = '';
  if (typeof data.employee === 'string') {
    employeeId = data.employee;
  } else {
    employeeId = data?.employee?.roleBaseUserId.toString();
  }
  if (id) {
    const findEmployee = await EmployeeUser.isEmployeeUserExistMethod(
      employeeId,
      {
        populate: true,
      },
    );
    data.employee = {
      roleBaseUserId: findEmployee._id,
      role: ENUM_USER_ROLE.employee,
      //@ts-ignore
      userId: findEmployee.userDetails._id,
    };
  }

  const updatedTaskManagement = await TaskManagement.findOneAndUpdate(
    { _id: id },
    data,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedTaskManagement) {
    throw new ApiError(400, 'Failed to update Task');
  }
  return updatedTaskManagement;
};
const updateTaskProgressFromDB = async (
  id: string,
  data: { completedTaskList: any[]; taskList: any[] },
  req: Request,
): Promise<ITaskManagement | null> => {
  const isExist = (await TaskManagement.findOne({
    _id: id,
    isDelete: false,
  })) as ITaskManagement & {
    _id: Schema.Types.ObjectId;
  } as ITaskManagement;
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.author?.userId?.toString() !== req?.user?.userId &&
    isExist?.employee?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  //@ts-ignore
  const taskList = isExist?.taskList?.map(task => task?.toObject());

  const updatedTaskList = taskList?.map(task => {
    const matchedCompletedTask = data?.completedTaskList?.find(
      item => item?.uuid === task?.uuid,
    );

    return {
      ...task,
      isCompleted: !!matchedCompletedTask,
    };
  });

  /* 
   let updatedTaskList = taskList;
  if (data?.completedTaskList?.length) {
    updatedTaskList = taskList?.map(task => {
      const matchedCompletedTask = data?.completedTaskList?.find(
        item => item?.uuid === task?.uuid,
      );

      return {
        ...task,
        isCompleted: !!matchedCompletedTask,
      };
    });
  }
  */

  const update = {
    ...data,
    taskList: updatedTaskList,
  };

  const updatedTaskManagement = await TaskManagement.findOneAndUpdate(
    { _id: id },
    update,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedTaskManagement) {
    throw new ApiError(400, 'Failed to update Task');
  }
  return updatedTaskManagement;
};

const getSingleTaskManagementFromDB = async (
  id: string,
  req?: Request,
): Promise<ITaskManagement | null> => {
  const task = await TaskManagement.isTaskManagementExistMethod(id, {
    populate: true,
  });
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    task?.author?.userId?.toString() !== req?.user?.userId &&
    task?.employee?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  return task;
};

const deleteTaskManagementFromDB = async (
  id: string,
  query: ITaskManagementFilters,
  req: Request,
): Promise<ITaskManagement | null> => {
  const isExist = (await TaskManagement.findOne({
    _id: id,
    isDelete: false,
  })) as ITaskManagement & {
    _id: Schema.Types.ObjectId;
  } as ITaskManagement;

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    isExist?.author?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  let data;

  if (
    query.delete == 'yes' && // this is permanently delete but store trash collection
    (req?.user?.role == ENUM_USER_ROLE.admin ||
      req?.user?.role == ENUM_USER_ROLE.superAdmin)
  ) {
    data = await TaskManagement.findOneAndDelete({ _id: id });
  } else {
    data = await TaskManagement.findOneAndUpdate(
      { _id: id },
      { isDelete: true },
      { new: true, runValidators: true },
    );
  }

  return data;
};

export const TaskManagementService = {
  createTaskManagement,
  getAllTaskManagementsFromDB,
  updateTaskManagementFromDB,
  getSingleTaskManagementFromDB,
  deleteTaskManagementFromDB,
  updateTaskProgressFromDB,
};
