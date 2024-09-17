import { Model } from 'mongoose';

import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../../global/enum_constant_type';
import { ICommonUser } from '../typesAndConst';
import { UserValidation } from '../user/user.validation';

export type IHrAdminUserFilters = {
  searchTerm?: string;
  userUniqueId?: string;
  gender?: string;
  countryName?: string;
  skills?: string;
  dateOfBirth?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: string | boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
  needProperty?: string;
  verify?: string;
};

export type IHrAdminUser = ICommonUser &
  z.infer<typeof UserValidation.hradminBodyData>;
export type HrAdminUserModel = {
  isHrAdminUserExistMethod(
    id: string,
    option: Partial<{
      isDelete: boolean;
      populate: boolean;
      needProperty?: string[];
    }>,
  ): Promise<IHrAdminUser>;
} & Model<IHrAdminUser>;
