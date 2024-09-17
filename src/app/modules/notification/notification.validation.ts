import { z } from 'zod';

import httpStatus from 'http-status';
import {
  I_STATUS,
  I_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../global/enum_constant_type';
import ApiError from '../../errors/ApiError';
import { I_USER_ROLE, USER_ROLE_ARRAY } from '../allUser/user/user.interface';

const NotificationZodSchema = z
  .object({
    userIds: z.array(z.string().optional()).optional(),
    subject: z.string().optional(),
    bodyText: z.string({
      required_error: 'notification body text is required',
    }),
    //
    role: z
      .enum([...USER_ROLE_ARRAY] as [I_USER_ROLE, ...I_USER_ROLE[]])
      .optional(),
    status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  })
  .refine(
    data => {
      if (!data.userIds && !data.role) {
        throw new ApiError(
          httpStatus.NOT_ACCEPTABLE,
          'Must be provide usersIds or role',
        );
      }
      return true;
    },
    { message: 'Must be provide users or role' },
  );

const updateNotificationZodSchema = z.object({
  userIds: z.array(z.string().optional()).optional(),
  subject: z.string().optional(),
  bodyText: z.string().optional(),

  //
  role: z
    .enum([...USER_ROLE_ARRAY] as [I_USER_ROLE, ...I_USER_ROLE[]])
    .optional(),
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isSeen: z.enum([...YN_ARRAY] as [I_YN, ...I_YN[]]).optional(),
  isDelete: z.boolean().optional().default(false),
});

export const NotificationValidation = {
  NotificationZodSchema,
  updateNotificationZodSchema,
};
