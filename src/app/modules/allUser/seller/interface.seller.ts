import { Model } from 'mongoose';

import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../../global/enum_constant_type';
import { ICommonUser } from '../typesAndConst';
import { UserValidation } from '../user/user.validation';

export type ISellerUserFilters = {
  searchTerm?: string;
  userUniqueId?: string;
  gender?: string;
  countryName?: string;
  skills?: string;
  dateOfBirth?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: I_YN;
  createdAtFrom?: string;
  createdAtTo?: string;
  needProperty?: string;
  verify?: string;
};

export type ISellerUser = ICommonUser &
  z.infer<typeof UserValidation.sellerZodData>;
export type SellerUserModel = {
  isSellerUserExistMethod(
    id: string,
    option: Partial<{
      isDelete: I_YN;
      populate: boolean;
      needProperty?: string[];
    }>,
  ): Promise<ISellerUser>;
} & Model<ISellerUser>;
