import { z } from 'zod';

import {
  I_STATUS,
  I_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../../global/enum_constant_type';
import { UserValidation } from '../user/user.validation';
// const combinedBuyerZodData = UserValidation.BuyerZodData.merge(
//   UserValidation.authData
// );
const combinedSellerZodData = UserValidation.buyerZodData.merge(
  UserValidation.authData.pick({ email: true }),
);
const otherProperties = z.object({
  status: z.enum(STATUS_ARRAY as [I_STATUS]).optional(),
  isDelete: z.enum([...YN_ARRAY] as [I_YN]).optional(),
});

const updateSellerZodSchema = z.object({
  body: combinedSellerZodData.merge(otherProperties).deepPartial(),
});

export const SellerValidation = {
  updateSellerZodSchema,
  combinedSellerZodData,
};
