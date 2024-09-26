import { z } from 'zod';

import { Types } from 'mongoose';
import { I_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../global/schema/global.schema';
import { zodRefUser } from '../allUser/typesAndConst';
import {
  ITaskProgressStatus,
  TaskProgressStatusArray,
} from './constants.taskManagement';

const TaskManagement_BodyData = z.object({
  title: z.string({ required_error: 'Title is required' }).nonempty(),
  projectId: z.string().or(z.instanceof(Types.ObjectId)).optional(),
  // assignBy: zodRefUser.optional(),//admin
  employee: zodRefUser.optional().or(z.string().optional()),
  taskList: z
    .array(z.object({ title: z.string(), uuid: z.string() }))
    .optional(),

  startDate: z.date().or(z.string()).optional(),
  endDate: z.date().or(z.string()).optional(),
  description: z.string().optional(),
  submitDocuments: z.array(zodFileAfterUploadSchema).optional(),
  taskProgressStatus: z
    .enum(TaskProgressStatusArray as [ITaskProgressStatus])
    .optional(),
});

const TaskManagement_UpdateBodyDate = z.object({
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  completedTaskList: z
    .array(z.object({ title: z.string(), uuid: z.string().optional() }))
    .optional(),
});

const createTaskManagementZodSchema = z.object({
  body: TaskManagement_BodyData,
});

const updateTaskManagementZodSchema = z.object({
  body: TaskManagement_BodyData.merge(
    TaskManagement_UpdateBodyDate,
  ).deepPartial(),
});
const TaskManagementBlockZodSchema = z.object({
  body: TaskManagement_BodyData.deepPartial(),
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

export const TaskManagementValidation = {
  createTaskManagementZodSchema,
  updateTaskManagementZodSchema,
  TaskManagementBlockZodSchema,
  //
  TaskManagement_BodyData,
  TaskManagement_UpdateBodyDate,
  //
};
