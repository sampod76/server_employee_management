import { z } from 'zod';

import { Types } from 'mongoose';
import { I_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../global/schema/global.schema';
import { zodRefUser } from '../allUser/typesAndConst';
import {
  ITaskProgressStatus,
  TaskProgressStatusArray,
} from './constants.taskManagement';

const Project_BodyData = z.object({
  title: z.string({ required_error: 'Title is required' }).nonempty(),
  projectId: z.string().or(z.instanceof(Types.ObjectId)).optional(),
  // assignBy: zodRefUser.optional(),//admin
  employee: zodRefUser.optional(),
  taskList: z.array(z.object({ title: z.string() })).optional(),
  start: z.date().or(z.string()).optional(),
  end: z.date().or(z.string()).optional(),
  description: z.string().optional(),
  submitDocuments: z.array(zodFileAfterUploadSchema).optional(),
  taskProgressStatus: z.enum(TaskProgressStatusArray as [ITaskProgressStatus]),
});

const Project_UpdateBodyDate = z.object({
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isDelete: z.boolean().optional().default(false),
});

const createProjectZodSchema = z.object({
  body: Project_BodyData,
});

const updateProjectZodSchema = z.object({
  body: Project_BodyData.merge(Project_UpdateBodyDate).deepPartial(),
});
const ProjectBlockZodSchema = z.object({
  body: Project_BodyData.deepPartial(),
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

export const ProjectValidation = {
  createProjectZodSchema,
  updateProjectZodSchema,
  ProjectBlockZodSchema,
  //
  Project_BodyData,
  Project_UpdateBodyDate,
  //
};
