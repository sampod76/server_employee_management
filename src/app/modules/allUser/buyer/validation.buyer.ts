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
const combinedBuyerUserZodData = UserValidation.buyerZodData.merge(
  UserValidation.authData.pick({ email: true }),
);
const otherProperties = z.object({
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isDelete: z.enum([...YN_ARRAY] as [I_YN, ...I_YN[]]).optional(),
});

const updateBuyerUserZodSchema = z.object({
  body: combinedBuyerUserZodData.merge(otherProperties).deepPartial(),
});

export const BuyerUserValidation = {
  updateBuyerUserZodSchema,
  combinedBuyerUserZodData,
};
