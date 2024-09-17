import { z } from 'zod';
import {
  I_STATUS,
  I_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../global/schema/global.schema';
const createCategoryBodyData = z.object({
  title: z.string({
    required_error: 'Title is required',
  }),
  subTitle: z.string(),
  image: zodFileAfterUploadSchema.optional(),
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  serialNumber: z.number().optional(),
});
const createCategoryZodSchema = z.object({
  body: createCategoryBodyData,
});

const updateCategoryZodSchema = createCategoryZodSchema
  .merge(
    z.object({
      isDelete: z.enum([...YN_ARRAY] as [I_YN, ...I_YN[]]).optional(),
    }),
  )
  .partial();

export const CategoryValidation = {
  createCategoryZodSchema,
  updateCategoryZodSchema,
  //
  createCategoryBodyData,
};
