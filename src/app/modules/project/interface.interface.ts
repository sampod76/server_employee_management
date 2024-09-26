import { Model, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../global/enum_constant_type';

import { IUserRef } from '../allUser/typesAndConst';
import { ProjectValidation } from './validation.project';

export type IProjectFilters = {
  authorUserId?: string;
  authorRoleBaseId?: string;
  clientEmail?: string;
  myData?: I_YN;
  //
  searchTerm?: string;
  needProperty?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: string | boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
};

export type IProject = z.infer<typeof ProjectValidation.Project_BodyData> &
  z.infer<typeof ProjectValidation.Project_UpdateBodyDate> & {
    author: IUserRef;
    _id?: Types.ObjectId | string;
  };
export type ProjectModel = {
  isProjectExistMethod(
    id: string,
    option: {
      isDelete?: boolean;
      populate?: boolean;
    },
  ): Promise<IProject>;
} & Model<IProject, Record<string, unknown>>;
