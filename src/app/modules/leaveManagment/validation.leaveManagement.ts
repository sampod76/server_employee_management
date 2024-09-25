import { z } from 'zod';

import httpStatus from 'http-status';
import { I_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../global/schema/global.schema';
import ApiError from '../../errors/ApiError';

const LeaveManagement_BodyData = z.object({
  // employee: zodRefUser.optional(), //set by controller
  from: z.date().or(z.string({ required_error: 'from date is required' })),
  to: z.date().or(z.string({ required_error: 'to date is required' })),
  provide: z.array(zodFileAfterUploadSchema).optional(),
  leaveType: z.string({ required_error: 'Leave type is required' }),
  dayType: z.string({ required_error: 'Leave type is required' }),
  location: z.string({ required_error: 'Leave type is required' }).optional(),
  reason: z
    .string({ required_error: 'Leave type is required' })
    .trim()
    .max(5000),
});

const LeaveManagement_UpdateBodyDate = z.object({
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
});

const createLeaveManagementZodSchema = z
  .object({
    body: LeaveManagement_BodyData,
  })
  .refine(
    ({ body }) => {
      const today = new Date();
      const normalizedToday = new Date(today.setHours(0, 0, 0, 0));
      const start = new Date(body.from);
      if (start < normalizedToday) {
        throw new ApiError(
          httpStatus.NOT_ACCEPTABLE,
          'startTime must be gater than today',
        );
      }
      const end = new Date(body.to);

      if (end.getTime() >= start.getTime()) {
        return true;
      } else {
        return false;
      }
    },
    {
      message: 'Start time should be before End time !  ',
    },
  );

const updateLeaveManagementZodSchema = z.object({
  body: LeaveManagement_BodyData.merge(
    LeaveManagement_UpdateBodyDate,
  ).partial(),
});

export const LeaveManagementValidation = {
  createLeaveManagementZodSchema,
  updateLeaveManagementZodSchema,

  //
  LeaveManagement_BodyData,
  LeaveManagement_UpdateBodyDate,
  //
};
