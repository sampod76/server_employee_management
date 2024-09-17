import { z } from 'zod';
import { I_VERIFY, VERIFY_ARRAY } from '../../typesAndConst';

export const hrAdminZodSchema = z.object({
  // buyer : zodRefUser,
  designation: z
    .string({ required_error: 'Designation is required' })
    .optional(),
  biography: z.string().max(5000).optional(),
  country: z.object({
    name: z.string({ required_error: 'Country is required' }),
    flag: z.object({ url: z.string().url() }).optional(),
    isoCode: z.string().optional(),
  }),
  skills: z.array(z.string()).optional(),
  verify: z.enum(VERIFY_ARRAY as [I_VERIFY]).optional(),
});
