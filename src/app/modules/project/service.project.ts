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

import { uuidGenerator } from '../../../utils/uuidGenerator';
import { IUserRef } from '../allUser/typesAndConst';
import { ProjectSearchableFields } from './constants.project';
import { IProject, IProjectFilters } from './interface.interface';
import { Project } from './models.project';

const createProject = async (
  data: IProject,
  requestUser: IUserRef,
  req: Request,
): Promise<IProject | null> => {
  // console.log(data, 'data');
  data.featureList = data?.featureList?.map(task => ({
    title: task.title,
    uuid: uuidGenerator(),
  }));
  const res = await Project.create(data);

  return res;
};

const getAllProjectsFromDB = async (
  filters: IProjectFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<IProject[] | null>> => {
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
      $or: ProjectSearchableFields.map((field: string) => ({
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
        } else if (field === 'myData' && value === 'yes') {
          modifyFiled = {
            $or: [
              {
                'author.userId': new Types.ObjectId(
                  req?.user?.userId as string,
                ),
              },
            ],
          };
        } else {
          modifyFiled = { [field]: value };
        }
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
  /*   //!------------check -access validation ------------------
  const check = (await Project.aggregate([
    {
      $match: whereConditions,
    },
    {
      $limit: 1,
    },
  ])) as IProject[];
  if (check.length) {
    if (
      check[0].author.userId.toString() !== req?.user?.userId &&
      req?.user?.role !== ENUM_USER_ROLE.admin &&
      req?.user?.role !== ENUM_USER_ROLE.superAdmin
    ) {
      throw new ApiError(httpStatus.FORBIDDEN, 'forbidden access data');
    }
  }
  //!------------check -access validation ------------------ */
  const pipeline: PipelineStage[] = [
    { $match: whereConditions },
    { $sort: sortConditions },
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
  ];

  //-----------------needProperty--lookup--------------------
  // if (needProperty?.toLowerCase()?.includes('author')) {
  const collections = [];

  collections.push({
    roleMatchFiledName: 'author.role',
    idFiledName: 'author.roleBaseUserId', //$sender.roleBaseUserId
    pipeLineMatchField: '_id', //$_id
    outPutFieldName: 'details',
    margeInField: 'author',
    //project: { name: 1, country: 1, profileImage: 1, email: 1 },
  });

  LookupAnyRoleDetailsReusable(pipeline, {
    collections: collections,
  });
  // }

  const resultArray = [
    Project.aggregate(pipeline),
    Project.countDocuments(whereConditions),
  ];
  const result = await Promise.all(resultArray);
  //!-- alternatively and faster
  /*
   const pipeLineResult = await Project.aggregate([
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
    data: result[0] as IProject[],
  };
};

const updateProjectFromDB = async (
  id: string,
  data: IProject,
  req: Request,
): Promise<IProject | null> => {
  const isExist = (await Project.findById(id)) as IProject & {
    _id: Schema.Types.ObjectId;
  } as IProject;
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.author?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { ...ProjectData } = data;
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin
  ) {
    delete (ProjectData as Partial<IProject>)['isDelete']; // remove it because , any user
  }

  const updatedProjectData: Partial<IProject> = { ...ProjectData };

  const updatedProject = await Project.findOneAndUpdate(
    { _id: id },
    updatedProjectData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedProject) {
    throw new ApiError(400, 'Failed to update Project');
  }
  return updatedProject;
};
const updateProjectBlockFromDb = async (
  id: string,
  data: IProject,
  req: Request,
): Promise<IProject | null> => {
  const isExist = (await Project.findOne({
    _id: id,
    isDelete: false,
  })) as IProject & {
    _id: Schema.Types.ObjectId;
  } as IProject;
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.author?.userId?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const updatedProject = await Project.findOneAndUpdate({ _id: id }, data, {
    new: true,
    runValidators: true,
  });
  if (!updatedProject) {
    throw new ApiError(400, 'Failed to update Project');
  }
  return updatedProject;
};

const getSingleProjectFromDB = async (
  id: string,
  req?: Request,
): Promise<IProject | null> => {
  const user = await Project.isProjectExistMethod(id, {
    populate: true,
  });

  return user;
};

const deleteProjectFromDB = async (
  id: string,
  query: IProjectFilters,
  req: Request,
): Promise<IProject | null> => {
  const isExist = (await Project.findOne({
    _id: id,
    isDelete: false,
  })) as IProject & {
    _id: Schema.Types.ObjectId;
  } as IProject;

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
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
    data = await Project.findOneAndDelete({ _id: id });
  } else {
    data = await Project.findOneAndUpdate(
      { _id: id },
      { isDelete: true },
      { new: true, runValidators: true },
    );
  }
  console.log(data);
  return data;
};

export const ProjectService = {
  createProject,
  getAllProjectsFromDB,
  updateProjectFromDB,
  getSingleProjectFromDB,
  deleteProjectFromDB,
  updateProjectBlockFromDb,
};
