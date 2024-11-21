import { z } from 'zod';

import { Types } from 'mongoose';
import { I_STATUS, STATUS_ARRAY } from '../../../../global/enum_constant_type';
import { zodRefUser } from '../../allUser/typesAndConst';

const friendshipBodyData = z.object({
  // sender: zodRefUser.required(), // set controller to sender
  receiver: zodRefUser.required(),
  gigId: z.string().or(z.instanceof(Types.ObjectId)).optional(),
  orderId: z.string().or(z.instanceof(Types.ObjectId)).optional(),
});

const friendshipUpdateBodyDate = z.object({
  // lastMessage: z.string().or(z.instanceof(Types.ObjectId)),
  requestAccept: z.boolean().optional(),
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isDelete: z.boolean().optional(),
});

const friendshipBlockZodData = z.object({
  block: z.object({
    isBlock: z.boolean().optional(),
    reason: z.string().optional(),
    lastBlockDate: z.date().optional(), // only type interface preps. Replace controller
    blocker: zodRefUser, // only type interface preps. Replace controller
  }),
});
const friendshipListSortData = z.object({
  updatedAt: z.string().datetime({ offset: true }).optional(),
});

const createfriendshipZodSchema = z.object({
  body: friendshipBodyData,
});

const updatefriendshipZodSchema = z.object({
  body: friendshipBodyData.merge(friendshipUpdateBodyDate).deepPartial(),
});
const friendshipBlockZodSchema = z.object({
  body: friendshipBodyData.deepPartial(),
});
const friendshipListSortDataZodSchema = z.object({
  body: friendshipBodyData.deepPartial(),
});
/* 
  .refine(({ body }) => {
    if (body.block?.lastBlockDate) {
      delete body.block.lastBlockDate;
      return body;
    }
    return true;
  });
   */

export const friendshipValidation = {
  createfriendshipZodSchema,
  updatefriendshipZodSchema,
  friendshipBlockZodSchema,
  friendshipListSortDataZodSchema,
  friendshipBodyZodData: friendshipBodyData,
  friendshipUpdateBodyDate,
  friendshipBlockZodData,
  friendshipListSortData,
};
