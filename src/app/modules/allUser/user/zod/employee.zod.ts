import { z } from 'zod';

export const employeeZodSchema = z
  .object({
    country: z
      .object({
        name: z.string({ required_error: 'Country is required' }),
        flag: z.object({ url: z.string().url() }).optional(),
        isoCode: z.string().optional(),
      })
      .optional(),
    verify: z.boolean().optional(),
  })
  .deepPartial();
