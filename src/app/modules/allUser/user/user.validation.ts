import { z } from 'zod';

import httpStatus from 'http-status';
import { I_STATUS, STATUS_ARRAY } from '../../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../../global/schema/global.schema';
import ApiError from '../../../errors/ApiError';
import { GENDER_ARRAY } from '../typesAndConst';
import { I_USER_ROLE, USER_ROLE_ARRAY } from './user.interface';
import { employeeZodSchema } from './zod/employee.zod';
import { hrAdminZodSchema } from './zod/hrAdmin.zod';

export const authData = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email(),
  role: z.enum([...USER_ROLE_ARRAY] as [string, ...string[]], {
    required_error: 'Role is required',
  }),
  password: z.string({
    required_error: 'Password is required.',
  }),
  userName: z.string({ required_error: 'User name is required' }).optional(),
  tempUser: z.object({
    tempUserId: z.string({ required_error: 'Temp user id is required' }),
    otp: z.union([
      z
        .string({ required_error: 'Otp is required' })
        .transform(val => Number(val)),
      z.number({ required_error: 'Otp is required' }),
    ]),
  }),
});

export const basicZodData = z.object({
  // fullName: z.string({ required_error: 'Full name is required' }),
  name: z.object({
    firstName: z.string({ required_error: 'First name is required' }),
    lastName: z.string({ required_error: 'Last name is required' }),
  }),
  // userName: z.string({ required_error: 'User name is required' }).optional(),
  contactNumber: z.string({ required_error: 'Contact number is required' }),
  biography: z.string().max(5000).optional(),
  gender: z
    .enum([...GENDER_ARRAY] as [string, ...string[]], {
      required_error: 'Gender is required',
    })
    .optional(),
  dateOfBirth: z.string().optional(),
  profileImage: zodFileAfterUploadSchema.optional(),
  // location: zodLocationSchema.optional(),
  address: z.object({ area: z.string().optional() }).optional(),
});

export const adminBodyData = basicZodData.merge(
  employeeZodSchema.pick({ nid: true, passport: true }),
);

export const hradminBodyData = basicZodData.merge(hrAdminZodSchema);
export const employeeBodyData = basicZodData.merge(employeeZodSchema);

const createUserZodSchema = z
  .object({
    body: z.object({
      authData: authData,
      admin: adminBodyData.optional(),
      hrAdmin: hradminBodyData.optional(),
      employee: employeeBodyData.optional(),
    }),
  })
  .refine(
    bodyData => {
      const role = bodyData.body.authData.role;
      if (role in bodyData.body) {
        return true;
      } else {
        throw new ApiError(
          httpStatus.NOT_ACCEPTABLE,
          `Please provide valid role(${role}) data`,
        );
      }
    },
    {
      message: `Please provide valid role base data`,
      path: ['body'],
    },
  );

//
const updateUserZodSchema = z.object({
  body: z.object({
    isDelete: z.boolean().optional().default(false),
    status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  }),
});

const tempUser = z.object({
  body: z.object({
    email: z.string({ required_error: 'email is required' }),
    role: z.enum([...USER_ROLE_ARRAY] as [I_USER_ROLE, ...I_USER_ROLE[]], {
      required_error: 'role is required',
    }),
  }),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
  tempUser,
  authData,
  adminBodyData,
  hradminBodyData,
  employeeBodyData,
};
