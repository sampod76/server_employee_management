import { Request, Response } from 'express';

import { PAGINATION_FIELDS } from '../../../global/constant/pagination';
import catchAsync from '../../share/catchAsync';
import pick from '../../share/pick';
import sendResponse from '../../share/sendResponse';
import { IUserRef, IUserRefAndDetails } from '../allUser/typesAndConst';
import { RequestToRefUserObject } from '../allUser/user/user.utils';

import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { LeaveManagementFilterableFields } from './constants.leaveManagement';
import { ILeaveManagement } from './interface.leaveManagement';
import { LeaveManagementService } from './service.leaveManagement';

const createLeaveManagement = catchAsync(
  async (req: Request, res: Response) => {
    req.body = {
      ...req.body,
      employee:
        req?.user?.role === ENUM_USER_ROLE.employee
          ? RequestToRefUserObject(req.user as IUserRefAndDetails)
          : req.body.employee,
    };

    const result = await LeaveManagementService.createLeaveManagementFromDb(
      req.body,
      req?.user as IUserRef,
      req,
    );
    sendResponse<ILeaveManagement>(req, res, {
      statusCode: 200,
      success: true,
      message: 'Leave request successfully',
      data: result,
    });
  },
);

//get all LeaveManagements
const getAllLeaveManagements = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, LeaveManagementFilterableFields);
    const paginationOptions = pick(req.query, PAGINATION_FIELDS);

    const result = await LeaveManagementService.getAllLeaveManagementsFromDB(
      filters,
      paginationOptions,
      req,
    );

    sendResponse(req, res, {
      statusCode: 200,
      success: true,
      message: 'All Leaves found successfully',
      data: result.data,
      meta: result.meta,
    });
  },
);

//get a LeaveManagement by id
const getLeaveManagementById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await LeaveManagementService.getSingleLeaveManagementFromDB(
      req.params.id,
      req,
    );

    sendResponse(req, res, {
      statusCode: 200,
      success: true,
      message: 'LeaveManagement found successfully',
      data: result,
    });
  },
);

//update LeaveManagement
const updateLeaveManagement = catchAsync(
  async (req: Request, res: Response) => {
    // await RequestToFileDecodeAddBodyHandle(req);
    const result = await LeaveManagementService.updateLeaveManagementFromDB(
      req.params.id,
      req.body,
      req,
    );

    sendResponse(req, res, {
      statusCode: 200,
      success: true,
      message: 'LeaveManagement updated successfully',
      data: result,
    });
  },
);

const approvedDeclinedlLeaveManagement = catchAsync(
  async (req: Request, res: Response) => {
    // await RequestToFileDecodeAddBodyHandle(req);
    const result =
      await LeaveManagementService.approvedDeclinedlLeaveManagementFromDB(
        req.params.id,
        req.body,
        req,
      );

    sendResponse(req, res, {
      statusCode: 200,
      success: true,
      message: 'LeaveManagement updated successfully',
      data: result,
    });
  },
);

//delete LeaveManagement
const deleteLeaveManagement = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await LeaveManagementService.deleteLeaveManagementFromDB(
      id,
      req.query,
      req,
    );

    sendResponse(req, res, {
      statusCode: 200,
      success: true,
      message: 'LeaveManagementD deleted successfully',
      data: result,
    });
  },
);

export const LeaveManagementController = {
  createLeaveManagement,
  getAllLeaveManagements,
  getLeaveManagementById,
  updateLeaveManagement,
  deleteLeaveManagement,
  approvedDeclinedlLeaveManagement,
};
