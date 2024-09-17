import { z } from 'zod';

import { Types } from 'mongoose';
import {
  I_STATUS,
  I_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../global/enum_constant_type';
import { zodRefUser } from '../allUser/typesAndConst';

const friendshipBodyData = z.object({
  // sender: zodRefUser.required(), // set controller to sender
  receiver: zodRefUser.required(),
});

const friendshipUpdateBodyDate = z.object({
  // lastMessage: z.string().or(z.instanceof(Types.ObjectId)),
  requestAccept: z.enum(YN_ARRAY as [I_YN]).optional(),
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isDelete: z.enum([...YN_ARRAY] as [I_YN, ...I_YN[]]).optional(),
});

const friendshipBlockZodData = z.object({
  block: z.object({
    isBlock: z.enum(YN_ARRAY as [I_YN]),
    reason: z.string().optional(),
    lastBlockDate: z.date().optional(), // only type interface preps. Replace controller
    blocker: zodRefUser, // only type interface preps. Replace controller
  }),
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
  friendshipBodyZodData: friendshipBodyData,
  friendshipUpdateBodyDate,
  friendshipBlockZodData,
};
