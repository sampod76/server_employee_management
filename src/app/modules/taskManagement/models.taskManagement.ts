import { model, PipelineStage, Schema, Types } from 'mongoose';

import {
  ENUM_STATUS,
  ENUM_YN,
  STATUS_ARRAY,
} from '../../../global/enum_constant_type';

import { mongooseFileSchema } from '../../../global/schema/global.schema';
import { LookupAnyRoleDetailsReusable } from '../../../helper/lookUpResuable';
import { ENUM_REDIS_KEY } from '../../redis/consent.redis';
import { redisClient } from '../../redis/redis';
import { mongooseIUserRef } from '../allUser/typesAndConst';
import { ProjectModel, IProject } from './interface.taskManagement';

const ProjectSchema = new Schema<IProject, ProjectModel>(
  {
    author: mongooseIUserRef,
    title: {
      type: String,
      required: true,
    },
    submitDocuments: [mongooseFileSchema],
    taskList: {
      type: [{ title: String }],
      trim: true,
    },
    employee: mongooseIUserRef,
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    start: {
      type: Date,
    },
    end: {
      type: Date,
    },

    description: {
      type: String,
      trim: true,
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
ProjectSchema.statics.isProjectExistMethod = async function (
  id: string,
  option?: {
    isDelete?: boolean;
    populate?: boolean;
  },
): Promise<IProject | null> {
  let data;
  if (!option?.populate) {
    const result = await Project.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDelete: option?.isDelete || ENUM_YN.NO,
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
          //project: { name: 1, country: 1, profileImage: 1, email: 1 },
        },
      ],
    });

    const result = await Project.aggregate(pipeline);

    data = result[0];
  }
  return data;
};
// before save then data then call this hook
/*
 ProjectSchema.pre('save', async function (next) {
  try {
    const data = this;
    const ProjectModel = this.constructor as ProjectModel; // Explicit cast
    const existing = await ProjectModel.findOne({
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
ProjectSchema.post('save', async function (data: IProject, next: any) {
  try {
    await redisClient().set(
      ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_DATA + data?._id,
      JSON.stringify(data),
      'EX',
      24 * 60, // 1 day to second
    );
    next();
  } catch (error: any) {
    next(error);
  }
});
// after findOneAndUpdate then data then call this hook
ProjectSchema.post(
  'findOneAndUpdate',
  async function (data: IProject, next: any) {
    try {
      await redisClient().set(
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
ProjectSchema.post(
  'findOneAndDelete',
  async function (data: IProject, next: any) {
    try {
      await redisClient().del(
        ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_DATA + data?._id,
      );
      next();
    } catch (error: any) {
      next(error);
    }
  },
);

export const Project = model<IProject, ProjectModel>('Project', ProjectSchema);
