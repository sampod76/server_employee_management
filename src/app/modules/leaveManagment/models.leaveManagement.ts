import { model, PipelineStage, Schema, Types } from 'mongoose';

import { ENUM_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';

import { mongooseFileSchema } from '../../../global/schema/global.schema';
import { LookupAnyRoleDetailsReusable } from '../../../helper/lookUpResuable';
import { ENUM_REDIS_KEY } from '../../redis/consent.redis';
import { redisClient } from '../../redis/redis';
import { mongooseIUserRef } from '../allUser/typesAndConst';

import {
  ENUM_LEAVE_MANAGEMENT_STATUS,
  LeaveManagementArray,
} from './constants.leaveManagement';
import {
  ILeaveManagement,
  LeaveManagementModel,
} from './interface.leaveManagement';

const LeaveManagementSchema = new Schema<
  ILeaveManagement,
  LeaveManagementModel
>(
  {
    employee: mongooseIUserRef,
    approvedBy: mongooseIUserRef,
    from: {
      type: Date,
    },
    to: {
      type: Date,
    },
    dayType: String,
    leaveType: String,
    location: String,
    reason: String,
    totalLeaveDays: Number,
    provide: [mongooseFileSchema],
    requestStatus: {
      type: String,
      enum: LeaveManagementArray,
      default: ENUM_LEAVE_MANAGEMENT_STATUS.pending,
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
LeaveManagementSchema.statics.isLeaveManagementExistMethod = async function (
  id: string,
  option?: {
    isDelete?: boolean;
    populate?: boolean;
  },
): Promise<ILeaveManagement | null> {
  let data;
  if (!option?.populate) {
    const result = await LeaveManagement.aggregate([
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
          roleMatchFiledName: 'employee.role',
          idFiledName: 'employee.roleBaseUserId', //$employee.roleBaseUserId
          pipeLineMatchField: '_id', //$_id
          outPutFieldName: 'details',
          margeInField: 'employee',
          //LeaveManagement: { name: 1, country: 1, profileImage: 1, email: 1 },
        },
      ],
    });

    const result = await LeaveManagement.aggregate(pipeline);

    data = result[0];
  }
  return data;
};
// before save then data then call this hook
/*
 LeaveManagementSchema.pre('save', async function (next) {
  try {
    const data = this;
    const LeaveManagementModel = this.constructor as LeaveManagementModel; // Explicit cast
    const existing = await LeaveManagementModel.findOne({
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
LeaveManagementSchema.post(
  'save',
  async function (data: ILeaveManagement, next: any) {
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
LeaveManagementSchema.post(
  'findOneAndUpdate',
  async function (data: ILeaveManagement, next: any) {
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
LeaveManagementSchema.post(
  'findOneAndDelete',
  async function (data: ILeaveManagement, next: any) {
    try {
      await redisClient.del(ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_DATA + data?._id);
      next();
    } catch (error: any) {
      next(error);
    }
  },
);

export const LeaveManagement = model<ILeaveManagement, LeaveManagementModel>(
  'LeaveManagement',
  LeaveManagementSchema,
);
