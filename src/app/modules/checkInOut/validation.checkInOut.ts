import { z } from 'zod';

import { I_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../global/schema/global.schema';
import { zodRefUser } from '../allUser/typesAndConst';

const CheckInOut_BodyData = z.object({
  // employee: zodRefUser.optional(), //set by controller
  // checkInTime: z.date().or(z.string()).optional(),
  // checkOutTime: z.date().or(z.string()).optional(),
  provide: z.array(zodFileAfterUploadSchema).optional(),
});
const CheckInOut_Admin_BodyData = z.object({
  employee: zodRefUser.or(z.string()), //set by controller
  checkInTime: z.date().or(z.string()).optional(),
  checkOutTime: z.date().or(z.string()).optional(),
  provide: z.array(zodFileAfterUploadSchema).optional(),
});

const CheckInOut_UpdateBodyDate = z.object({
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
});

const createCheckInOutZodSchema = z.object({
  body: CheckInOut_BodyData,
});
const createAdminByCheckInOutZodSchema = z.object({
  body: CheckInOut_Admin_BodyData,
});

const updateCheckInOutZodSchema = z.object({
  body: CheckInOut_BodyData.merge(CheckInOut_UpdateBodyDate).deepPartial(),
});

export const CheckInOutValidation = {
  createCheckInOutZodSchema,
  updateCheckInOutZodSchema,

  //
  CheckInOut_BodyData,
  CheckInOut_UpdateBodyDate,
  //
  createAdminByCheckInOutZodSchema,
};
