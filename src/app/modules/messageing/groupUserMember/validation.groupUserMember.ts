import { z } from 'zod';

import { Types } from 'mongoose';
import { I_STATUS, STATUS_ARRAY } from '../../../../global/enum_constant_type';
import { zodRefUser } from '../../allUser/typesAndConst';

const GroupMemberBodyData = z.object({
  // sender: zodRefUser.required(), // set controller to sender
  receiver: zodRefUser.required(),
  groupId: z.string().or(z.instanceof(Types.ObjectId)),
  orderId: z.string().or(z.instanceof(Types.ObjectId)).optional(),
});

const GroupMemberUpdateBodyDate = z.object({
  // lastMessage: z.string().or(z.instanceof(Types.ObjectId)),
  requestAccept: z.boolean().optional(),
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isDelete: z.boolean().optional(),
});

const GroupMemberBlockZodData = z.object({
  block: z.object({
    isBlock: z.boolean(),
    reason: z.string().optional(),
    lastBlockDate: z.date().optional(), // only type interface preps. Replace controller
    blocker: zodRefUser, // only type interface preps. Replace controller
  }),
});
const GroupMemberListSortData = z.object({
  updatedAt: z.string().datetime({ offset: true }).optional(),
});

const createGroupMemberZodSchema = z.object({
  body: GroupMemberBodyData,
});

const updateGroupMemberZodSchema = z.object({
  body: GroupMemberBodyData.merge(GroupMemberUpdateBodyDate).deepPartial(),
});
const GroupMemberBlockZodSchema = z.object({
  body: GroupMemberBodyData.deepPartial(),
});
const GroupMemberListSortDataZodSchema = z.object({
  body: GroupMemberListSortData.deepPartial(),
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

export const GroupMemberValidation = {
  createGroupMemberZodSchema,
  updateGroupMemberZodSchema,
  GroupMemberBlockZodSchema,
  GroupMemberListSortDataZodSchema,
  GroupMemberBodyZodData: GroupMemberBodyData,
  GroupMemberUpdateBodyDate,
  GroupMemberBlockZodData,
  GroupMemberListSortData,
};
