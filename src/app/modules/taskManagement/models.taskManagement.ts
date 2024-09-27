import { model, PipelineStage, Schema, Types } from 'mongoose';

import { ENUM_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';

import { mongooseFileSchema } from '../../../global/schema/global.schema';
import { LookupAnyRoleDetailsReusable } from '../../../helper/lookUpResuable';
import { ENUM_REDIS_KEY } from '../../redis/consent.redis';
import { redisClient } from '../../redis/redis';
import { mongooseIUserRef } from '../allUser/typesAndConst';
import {
  ENUM_TASK_PROGRESS_STATUS,
  TaskProgressStatusArray,
} from './constants.taskManagement';
import {
  ITaskManagement,
  TaskManagementModel,
} from './interface.taskManagement';

const TaskManagementSchema = new Schema<ITaskManagement, TaskManagementModel>(
  {
    title: {
      type: String,
      trim: true,
    },
    projectId: {
      type: Types.ObjectId,
      ref: 'Project',
    },
    author: mongooseIUserRef,
    employee: mongooseIUserRef,
    taskList: [
      {
        title: {
          type: String,
          trim: true,
        },
        uuid: {
          type: String,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    completedTaskList: [
      {
        title: {
          type: String,
          trim: true,
        },
        uuid: String,
      },
    ],
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    description: {
      type: String,
      trim: true,
    },
    submitDocuments: [mongooseFileSchema],
    taskProgressStatus: {
      type: String,
      enum: TaskProgressStatusArray,
      default: ENUM_TASK_PROGRESS_STATUS.toDo,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: STATUS_ARRAY,
      default: ENUM_STATUS.ACTIVE,
    },
    //--- for --TrashCategory---
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);
TaskManagementSchema.statics.isTaskManagementExistMethod = async function (
  id: string,
  option?: {
    isDelete?: boolean;
    populate?: boolean;
  },
): Promise<ITaskManagement | null> {
  let data;
  if (!option?.populate) {
    const result = await TaskManagement.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDelete: option?.isDelete || false,
        },
      },
    ]);
    data = result[0];
  } else {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDelete: option.isDelete || false,
        },
      },
    ];

    LookupAnyRoleDetailsReusable(pipeline, {
      collections: [
        {
          roleMatchFiledName: 'author.role',
          idFiledName: 'author.roleBaseUserId', //$author.roleBaseUserId
          pipeLineMatchField: '_id', //$_id
          outPutFieldName: 'details',
          margeInField: 'author',
          //TaskManagement: { name: 1, country: 1, profileImage: 1, email: 1 },
        },
      ],
    });

    const result = await TaskManagement.aggregate(pipeline);

    data = result[0];
  }
  return data;
};
// before save then data then call this hook
/*
 TaskManagementSchema.pre('save', async function (next) {
  try {
    const data = this;
    const TaskManagementModel = this.constructor as TaskManagementModel; // Explicit cast
    const existing = await TaskManagementModel.findOne({
      sender: new Types.ObjectId(data.sender.userId),
    });
    if (existing) {
      throw new ApiError(400, 'Already send friend request');
    }

    next();
  } catch (error: any) {
    next(error);
  }
}); 
*/

// after save then data then call this hook
TaskManagementSchema.post(
  'save',
  async function (data: ITaskManagement, next: any) {
    try {
      await redisClient.set(
        ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_DATA + data?._id,
        JSON.stringify(data),
        'EX',
        24 * 60, // 1 day to second
      );
      next();
    } catch (error: any) {
      next(error);
    }
  },
);
// after findOneAndUpdate then data then call this hook
TaskManagementSchema.post(
  'findOneAndUpdate',
  async function (data: ITaskManagement, next: any) {
    try {
      await redisClient.set(
        ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_DATA + data?._id,
        JSON.stringify(data),
        'EX',
        24 * 60, // 1 day to second
      );
      next();
    } catch (error: any) {
      next(error);
    }
  },
);
// after findOneAndDelete then data then call this hook
TaskManagementSchema.post(
  'findOneAndDelete',
  async function (data: ITaskManagement, next: any) {
    try {
      await redisClient.del(ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_DATA + data?._id);
      next();
    } catch (error: any) {
      next(error);
    }
  },
);

export const TaskManagement = model<ITaskManagement, TaskManagementModel>(
  'TaskManagement',
  TaskManagementSchema,
);
