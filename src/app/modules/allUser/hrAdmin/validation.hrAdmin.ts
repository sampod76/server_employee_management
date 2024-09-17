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
const combinedHrAdminZodData = UserValidation.hradminBodyData.merge(
  UserValidation.authData.pick({ email: true }),
);
const otherProperties = z.object({
  status: z.enum(STATUS_ARRAY as [I_STATUS]).optional(),
  isDelete: z.boolean().optional(),
});

const updateHrAdminZodSchema = z.object({
  body: combinedHrAdminZodData.merge(otherProperties).deepPartial(),
});

export const HrAdminValidation = {
  updateHrAdminZodSchema,
  combinedHrAdminZodData,
};
