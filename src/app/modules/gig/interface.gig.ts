import { Model } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../global/enum_constant_type';

import { IUserRef } from '../allUser/typesAndConst';
import { GigValidation } from './validation.gig';

export type IGigFilters = {
  sellerUserId?: string;
  sellerRoleUserId?: string;
  category?: string;
  verify?: string;
  selectField?: string;
  //
  searchTerm?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  needProperty?: string;
};

export type IGig = z.infer<typeof GigValidation.GigBodyData> &
  z.infer<typeof GigValidation.GigUpdateBodyDate> & {
    seller: IUserRef;
  };
export type GigModel = {
  isGigExistMethod(
    id: string,
    option: {
      isDelete?: boolean;
      populate?: boolean;
      needProperty?: string[];
    },
  ): Promise<IGig>;
} & Model<IGig, Record<string, unknown>>;
