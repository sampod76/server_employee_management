import { z } from 'zod';

import { UserValidation } from '../user/user.validation';
import {
  I_STATUS,
  I_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../../global/enum_constant_type';
// const combinedAdminZodData = UserValidation.adminZodData.merge(
//   UserValidation.authData
// );
const combinedAdminZodData = UserValidation.adminZodData.merge(
  UserValidation.authData.pick({ email: true }),
);
const otherProperties = z.object({
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isDelete: z.enum([...YN_ARRAY] as [I_YN, ...I_YN[]]).optional(),
});

const updateAdminZodSchema = z.object({
  body: combinedAdminZodData.merge(otherProperties).deepPartial(),
});

export const AdminValidation = {
  updateAdminZodSchema,
  combinedAdminZodData,
};
