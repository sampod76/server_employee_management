import { z } from 'zod';

import httpStatus from 'http-status';
import { I_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../global/schema/global.schema';
import ApiError from '../../errors/ApiError';

const Project_BodyData = z.object({
  // author: zodRefUser.required(),// set controller to sender
  title: z.string({ required_error: 'Title is required' }).nonempty(),
  logo: zodFileAfterUploadSchema.optional(),
  featureList: z
    .array(z.object({ title: z.string(), uuid: z.string().optional() }))
    .optional(),
  startDate: z.date().or(z.string()).optional(),
  endDate: z.date().or(z.string()).optional(),
  extended: z.array(z.date()).optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  description: z.string().optional(),
});

const Project_UpdateBodyDate = z.object({
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
  isDelete: z.boolean().optional().default(false),
});

const createProjectZodSchema = z
  .object({
    body: Project_BodyData,
  })
  .refine(
    ({ body }) => {
      const today = new Date();
      const normalizedToday = new Date(today.setHours(0, 0, 0, 0));
      if (body.startDate) {
        const start = new Date(body.startDate);
        if (start < normalizedToday) {
          throw new ApiError(
            httpStatus.NOT_ACCEPTABLE,
            'startTime must be gater than today',
          );
        }
        if (body.endDate) {
          const end = new Date(body.endDate);
          if (end < start) {
            throw new ApiError(
              httpStatus.NOT_ACCEPTABLE,
              'End time must be after Start time',
            );
          }
        }
      }

      return true;
    },
    {
      message: 'Start time should be before End time !  ',
    },
  );

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
