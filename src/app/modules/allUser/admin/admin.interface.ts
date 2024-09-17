import { Model } from 'mongoose';

import { ICommonUser } from '../typesAndConst';
import { I_USER_ROLE } from '../user/user.interface';
import { I_STATUS, I_YN } from '../../../../global/enum_constant_type';

export type IAdminFilters = {
  searchTerm?: string;
  delete?: I_YN;
  role?: I_USER_ROLE;
  multipleRole?: I_USER_ROLE[];
  status?: I_STATUS;
  isDelete?: I_YN;
  author?: string;
};

export type IAdmin = ICommonUser;
export type AdminModel = {
  isAdminExistMethod(
    email: string,
  ): Promise<Pick<IAdmin, 'email' | 'status' | 'userUniqueId' | '_id'>>;
} & Model<IAdmin>;
