import { z } from 'zod';

import { I_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../global/schema/global.schema';
import { DATA_TYPE_ARRAY } from './interface.AllTextField';

const createAllTextFieldZodSchema = z.object({
  body: z.object({
    heading: z.string().optional(),
    htmlText: z.string({ required_error: 'Html text is required' }).optional(),
    status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
    dataType: z.enum([...DATA_TYPE_ARRAY] as [string, ...string[]]),
    image: zodFileAfterUploadSchema.optional(),
    bodyData: z
      .object({
        heading1: z.string().optional(),
        heading2: z.string().optional(),
        heading3: z.string().optional(),
        heading4: z.string().optional(),
      })
      .optional(),
  }),
});

const updateAllTextFieldZodSchema = createAllTextFieldZodSchema
  .merge(
    z.object({
      isDelete: z.boolean().optional(),
    }),
  )
  .deepPartial();

export const AllTextFieldValidation = {
  createAllTextFieldZodSchema,
  updateAllTextFieldZodSchema,
};
