import { Model } from 'mongoose';

import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../../global/enum_constant_type';
import { ICommonUser } from '../typesAndConst';
import { UserValidation } from '../user/user.validation';

export type IEmployeeUserFilters = {
  searchTerm?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: string | boolean;
  authorRoleBaseId?: string;
  needProperty?: string;
  verify?: string;
};

export type IEmployeeUser = ICommonUser &
  z.infer<typeof UserValidation.employeeBodyData>;
export type EmployeeUserModel = {
  isEmployeeUserExistMethod(
    id: string,
    option: { isDelete?: boolean; populate?: boolean; needProperty?: string[] },
  ): Promise<IEmployeeUser>;
} & Model<IEmployeeUser>;
