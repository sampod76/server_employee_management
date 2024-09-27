import { Model } from 'mongoose';

import { I_STATUS, I_YN } from '../../../../global/enum_constant_type';
import { ICommonUser } from '../typesAndConst';
import { I_USER_ROLE } from '../user/user.interface';

export type IAdminFilters = {
  searchTerm?: string;
  delete?: I_YN;
  role?: I_USER_ROLE;
  multipleRole?: I_USER_ROLE[];
  status?: I_STATUS;
  isDelete?: string | boolean;
  author?: string;
};

export type IAdmin = ICommonUser & {
  nid: string;
  passport: string;
};
export type AdminModel = {
  isAdminExistMethod(
    email: string,
  ): Promise<Pick<IAdmin, 'email' | 'status' | 'userUniqueId' | '_id'>>;
} & Model<IAdmin>;
