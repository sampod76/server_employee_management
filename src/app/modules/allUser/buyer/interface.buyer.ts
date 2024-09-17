import { Model } from 'mongoose';

import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../../global/enum_constant_type';
import { ICommonUser, IUserRef } from '../typesAndConst';
import { UserValidation } from '../user/user.validation';

export type IBuyerUserFilters = {
  searchTerm?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: I_YN;
  authorRoleBaseId?: string;
  needProperty?: string;
  verify?: string;
};

export type IBuyerUser = ICommonUser &
  z.infer<typeof UserValidation.buyerZodData> & {
    buyer?: IUserRef;
  };
export type BuyerUserModel = {
  isBuyerUserExistMethod(
    id: string,
    option: { isDelete?: I_YN; populate?: boolean; needProperty?: string[] },
  ): Promise<IBuyerUser>;
} & Model<IBuyerUser>;
