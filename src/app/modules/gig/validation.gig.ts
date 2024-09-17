import { z } from 'zod';

import { Types } from 'mongoose';
import { I_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../global/schema/global.schema';
import { I_VERIFY, VERIFY_ARRAY } from '../allUser/typesAndConst';
import { ENUM_ORDER_PACKAGE_NAME } from './constants.gig';
export const ORDER_PACKAGE_NAME_ARRAY = Object.values(ENUM_ORDER_PACKAGE_NAME);
export type IOrderPackageName = keyof typeof ENUM_ORDER_PACKAGE_NAME;
export const zodPackageSchema = z.object({
  packageName: z.enum(ORDER_PACKAGE_NAME_ARRAY as [IOrderPackageName]),
  price: z.number({ required_error: 'Price is required' }).nonnegative(),
  deliveryTime: z
    .number({ required_error: 'DeliveryTime is required' })
    .nonnegative(),
  featuresList: z.array(
    z.object({ title: z.string({ required_error: 'Features is required' }) }),
  ),
});

const GigBodyData = z.object({
  // seller : zodRefUser, //set by service by req.user
  category: z.union([z.string(), z.instanceof(Types.ObjectId)], {
    required_error: 'Category id is required',
  }),
  title: z.string({ required_error: 'Title is required' }),
  additionalDescription: z.string({
    required_error: 'Additional description is required',
  }),
  verify: z.enum(VERIFY_ARRAY as [I_VERIFY, ...I_VERIFY[]]).optional(),
  tags: z.array(z.string()).optional(),
  // packages: z.object({
  //   bronze: zodPackageSchema,
  //   silver: zodPackageSchema,
  //   gold: zodPackageSchema.optional(),
  //   extraPackage: zodPackageSchema.optional(),
  // }),
  weoffer: z.array(z.object({ title: z.string().max(500) })),
  packages: z.array(zodPackageSchema),
  images: z.array(zodFileAfterUploadSchema).min(1).max(5),
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
});

const GigUpdateBodyDate = z.object({
  isDelete: z.boolean().optional(),
});

const createGigZodSchema = z.object({
  body: GigBodyData,
});

const updateGigZodSchema = z.object({
  body: GigBodyData.merge(GigUpdateBodyDate).deepPartial(),
});

export const GigValidation = {
  createGigZodSchema,
  updateGigZodSchema,
  GigBodyData,
  GigUpdateBodyDate,
  zodPackageSchema,
};
