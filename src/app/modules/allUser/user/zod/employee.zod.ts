import { z } from 'zod';
import { zodFileAfterUploadSchema } from '../../../../../global/schema/global.schema';

export const employeeZodSchema = z
  .object({
    nid: z.string(),
    verify: z.boolean(),
    passport: z.string(),
    documents: z.array(zodFileAfterUploadSchema),
  })
  .deepPartial();
