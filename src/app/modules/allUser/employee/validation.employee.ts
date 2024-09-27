import { z } from 'zod';

import { I_STATUS, STATUS_ARRAY } from '../../../../global/enum_constant_type';
import { UserValidation } from '../user/user.validation';
// const combinedemployeeBodyData = UserValidation.employeeBodyData.merge(
//   UserValidation.authData
// );
const combinedEmployeeUserZodData = UserValidation.employeeBodyData.merge(
  UserValidation.authData.pick({ email: true }),
);
const otherProperties = z.object({
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isDelete: z.boolean().optional().default(false),
});

const updateEmployeeUserZodSchema = z.object({
  body: combinedEmployeeUserZodData.merge(otherProperties).deepPartial(),
});

export const EmployeeUserValidation = {
  updateEmployeeUserZodSchema,
  combinedEmployeeUserZodData,
};
