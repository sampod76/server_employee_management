import { Model, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../global/enum_constant_type';

import { IUserRef } from '../allUser/typesAndConst';
import { TaskManagementValidation } from './validation.taskManagement';

export type ITaskManagementFilters = {
  employeeUserId?: string;
  employeeRoleBaseId?: string;
  authorUserId?: string;
  authorRoleBaseId?: string;
  projectId?: string;
  //
  myData?: I_YN;
  startDate?: string;
  endDate?: string;
  //
  searchTerm?: string;
  needProperty?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: string | boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
};

export type ITaskManagement = z.infer<
  typeof TaskManagementValidation.TaskManagement_BodyData
> &
  z.infer<typeof TaskManagementValidation.TaskManagement_UpdateBodyDate> & {
    employee: IUserRef;
    author: IUserRef;
    _id?: Types.ObjectId | string;
    projectId?: Types.ObjectId | string;
    isDelete: boolean;
  };
export type TaskManagementModel = {
  isTaskManagementExistMethod(
    id: string,
    option: {
      isDelete?: boolean;
      populate?: boolean;
      needProperty?: string[];
    },
  ): Promise<ITaskManagement>;
} & Model<ITaskManagement, Record<string, unknown>>;
