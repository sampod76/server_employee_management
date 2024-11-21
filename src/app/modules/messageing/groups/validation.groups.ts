import { z } from 'zod';

import { I_STATUS, STATUS_ARRAY } from '../../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../../global/schema/global.schema';
import { zodRefUser } from '../../allUser/typesAndConst';
const projectSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().min(1, 'Price should be a positive number').optional(),
    projectStart: z
      .string()
      .datetime({ offset: true })
      .or(z.date())
      .refine(val => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, 'Invalid projectStart date'),
    projectDeadline: z
      .string()
      .datetime({ offset: true })
      .or(z.date())
      .optional()
      .refine(val => {
        if (val) {
          const date = new Date(val);
          return !isNaN(date.getTime());
        }
        return true;
      }, 'Invalid projectDeadline date'),
  })
  .superRefine((project, ctx) => {
    const today = new Date(new Date().setHours(0, 0, 0, 0)).getTime(); // Start of today as timestamp
    const projectStart = new Date(project.projectStart).getTime();
    // Check if `projectStart` is in the future
    if (projectStart < today) {
      ctx.addIssue({
        path: ['projectStart'],
        message: 'projectStart date cannot be in the future',
        code: 'custom',
      });
    }
    // If `projectDeadline` is provided, validate it
    if (project.projectDeadline) {
      const projectDeadline = new Date(project.projectDeadline).getTime();
      // Check if `projectDeadline` is in the past
      if (projectDeadline < today) {
        ctx.addIssue({
          path: ['projectDeadline'],
          message: 'projectDeadline date cannot be in the past',
          code: 'custom',
        });
      }
      // Check if `projectDeadline` is before `projectStart`
      if (projectDeadline < projectStart) {
        ctx.addIssue({
          path: ['projectDeadline'],
          message: 'projectDeadline date must be after or on projectStart',
          code: 'custom',
        });
      }
    }
  });

const GroupsBodyData = z.object({
  name: z.string().min(1, 'Team name is required'),
  // membersCount: z.number().min(1, 'Members count should be a positive number'),
  project: projectSchema,
  author: zodRefUser.optional(), //replace controller
  profileImage: zodFileAfterUploadSchema.optional(),
  coverImage: zodFileAfterUploadSchema.optional(),
});

const GroupsUpdateBodyDate = z.object({
  // lastMessage: z.string().or(z.instanceof(Types.ObjectId)),
  // requestAccept: z.enum(YN_ARRAY as [I_YN]).optional(),
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isDelete: z.boolean().optional(),
});
const GroupsListSortData = z.object({
  updatedAt: z.string().datetime({ offset: true }).optional(),
});
const createGroupsZodSchema = z.object({
  body: GroupsBodyData,
});

const updateGroupsZodSchema = z.object({
  body: GroupsBodyData.merge(GroupsUpdateBodyDate).deepPartial(),
});
const GroupsListSortDataZodSchema = z.object({
  body: GroupsListSortData.deepPartial(),
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

export const GroupsValidation = {
  createGroupsZodSchema,
  updateGroupsZodSchema,
  GroupsBodyZodData: GroupsBodyData,
  GroupsUpdateBodyDate,
  GroupsListSortDataZodSchema,
};
