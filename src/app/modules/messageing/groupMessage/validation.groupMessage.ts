import { z } from 'zod';

import { Types } from 'mongoose';
import { I_STATUS, STATUS_ARRAY } from '../../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../../global/schema/global.schema';
import { zodRefUser } from '../../allUser/typesAndConst';

export const groupMessageZodData = z.object({
  sender: zodRefUser.optional(),
  // receiver: zodRefUser.required(),
  groupId: z.string().or(z.instanceof(Types.ObjectId)),
  uuid: z.string().optional(),
  createTime: z.string().datetime().optional(),
  //
  groupMemberId: z.string().or(z.instanceof(Types.ObjectId)), //!
  //
  orderId: z.string().or(z.instanceof(Types.ObjectId)).optional(),
  message: z.string().max(5000, { message: 'Max text length 5000' }),
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isDelete: z.boolean().optional(),
  isSeen: z.boolean().optional(),
  files: z.array(zodFileAfterUploadSchema).optional(),
});
