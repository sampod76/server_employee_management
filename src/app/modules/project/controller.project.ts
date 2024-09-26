import { Request, Response } from 'express';

import { PAGINATION_FIELDS } from '../../../global/constant/pagination';
import catchAsync from '../../share/catchAsync';
import pick from '../../share/pick';
import sendResponse from '../../share/sendResponse';
import { IUserRef, IUserRefAndDetails } from '../allUser/typesAndConst';
import { RequestToRefUserObject } from '../allUser/user/user.utils';
import { ProjectFilterableFields } from './constants.project';
import { IProject } from './interface.interface';
import { ProjectService } from './service.project';

const createProject = catchAsync(async (req: Request, res: Response) => {
  req.body = {
    ...req.body,
    author: RequestToRefUserObject(req.user as IUserRefAndDetails),
  };
  const result = await ProjectService.createProject(
    req.body,
    req?.user as IUserRef,
    req,
  );
  sendResponse<IProject>(req, res, {
    statusCode: 200,
    success: true,
    message: 'Project created successfully',
    data: result,
  });
});

//get all Projects
const getAllProjects = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ProjectFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);

  const result = await ProjectService.getAllProjectsFromDB(
    filters,
    paginationOptions,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Projects found successfully',
    data: result.data,
    meta: result.meta,
  });
});

//get a Project by id
const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.getSingleProjectFromDB(
    req.params.id,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Project found successfully',
    data: result,
  });
});

//update Project
const updateProject = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  const result = await ProjectService.updateProjectFromDB(
    req.params.id,
    req.body,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Project updated successfully',
    data: result,
  });
});

//delete Project
const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ProjectService.deleteProjectFromDB(id, req.query, req);

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Project deleted successfully',
    data: result,
  });
});

export const ProjectController = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
