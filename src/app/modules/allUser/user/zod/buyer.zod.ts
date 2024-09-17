import { z } from 'zod';
import { I_VERIFY, VERIFY_ARRAY } from '../../typesAndConst';

export const buyerZodSchema = z
  .object({
    country: z
      .object({
        name: z.string({ required_error: 'Country is required' }),
        flag: z.object({ url: z.string().url() }).optional(),
        isoCode: z.string().optional(),
      })
      .optional(),
    verify: z.enum(VERIFY_ARRAY as [I_VERIFY, ...I_VERIFY[]]).optional(),
  })
  .deepPartial();
