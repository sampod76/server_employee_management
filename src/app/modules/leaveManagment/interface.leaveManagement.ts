import { Model, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../global/enum_constant_type';

import { IUserRef } from '../allUser/typesAndConst';
import { ILeaveManagementStatus } from './constants.leaveManagement';
import { LeaveManagementValidation } from './validation.leaveManagement';

export type ILeaveManagementFilters = {
  employeeUserId?: string;
  employeeRoleBaseId?: string;
  requestStatus?: string;
  //
  myData?: I_YN;
  from?: string;
  to?: string;
  totalLeaveDays?: number;
  //
  searchTerm?: string;
  needProperty?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: string | boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
};

export type ILeaveManagement = z.infer<
  typeof LeaveManagementValidation.LeaveManagement_BodyData
> &
  z.infer<typeof LeaveManagementValidation.LeaveManagement_UpdateBodyDate> & {
    employee: IUserRef;
    approvedBy: IUserRef;
    _id?: Types.ObjectId | string;
    isDelete: boolean;
    totalLeaveDays?: number;
    requestStatus: ILeaveManagementStatus;
  };
export type LeaveManagementModel = {
  isLeaveManagementExistMethod(
    id: string,
    option: {
      isDelete?: boolean;
      populate?: boolean;
      needProperty?: string[];
    },
  ): Promise<ILeaveManagement>;
} & Model<ILeaveManagement, Record<string, unknown>>;
