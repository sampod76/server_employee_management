import { z } from 'zod';

import { Types } from 'mongoose';
import {
  I_STATUS,
  I_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../global/schema/global.schema';
import { zodRefUser } from '../allUser/typesAndConst';

export const messageZodData = z.object({
  sender: zodRefUser.required(),
  receiver: zodRefUser.required(),
  friendShipId: z.string().or(z.instanceof(Types.ObjectId)),
  message: z.string().max(90000, { message: 'Max text length 90000' }),
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isDelete: z.boolean().optional().default(false),
  isSeen: z.enum([...YN_ARRAY] as [I_YN, ...I_YN[]]).optional(),
  files: z.array(zodFileAfterUploadSchema).optional(),
});
