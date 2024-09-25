import { model, PipelineStage, Schema, Types } from 'mongoose';

import { ENUM_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';

import { mongooseFileSchema } from '../../../global/schema/global.schema';
import { LookupAnyRoleDetailsReusable } from '../../../helper/lookUpResuable';
import { ENUM_REDIS_KEY } from '../../redis/consent.redis';
import { redisClient } from '../../redis/redis';
import { mongooseIUserRef } from '../allUser/typesAndConst';

import { CheckInOutModel, ICheckInOut } from './interface.checkInOut';

const CheckInOutSchema = new Schema<ICheckInOut, CheckInOutModel>(
  {
    employee: mongooseIUserRef,
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    provide: [mongooseFileSchema],
    isDelete: {
      type: Boolean,
      default: false,
    },
    isLate: {
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
CheckInOutSchema.statics.isCheckInOutExistMethod = async function (
  id: string,
  option?: {
    isDelete?: boolean;
    populate?: boolean;
  },
): Promise<ICheckInOut | null> {
  let data;
  if (!option?.populate) {
    const result = await CheckInOut.aggregate([
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
          //CheckInOut: { name: 1, country: 1, profileImage: 1, email: 1 },
        },
      ],
    });

    const result = await CheckInOut.aggregate(pipeline);

    data = result[0];
  }
  return data;
};
// before save then data then call this hook
/*
 CheckInOutSchema.pre('save', async function (next) {
  try {
    const data = this;
    const CheckInOutModel = this.constructor as CheckInOutModel; // Explicit cast
    const existing = await CheckInOutModel.findOne({
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
CheckInOutSchema.post('save', async function (data: ICheckInOut, next: any) {
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
});
// after findOneAndUpdate then data then call this hook
CheckInOutSchema.post(
  'findOneAndUpdate',
  async function (data: ICheckInOut, next: any) {
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
CheckInOutSchema.post(
  'findOneAndDelete',
  async function (data: ICheckInOut, next: any) {
    try {
      await redisClient.del(ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_DATA + data?._id);
      next();
    } catch (error: any) {
      next(error);
    }
  },
);

export const CheckInOut = model<ICheckInOut, CheckInOutModel>(
  'CheckInOut',
  CheckInOutSchema,
);
