import { model, PipelineStage, Schema, Types } from 'mongoose';

import {
  ENUM_STATUS,
  ENUM_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../global/enum_constant_type';

import { LookupAnyRoleDetailsReusable } from '../../../helper/lookUpResuable';
import { ENUM_REDIS_KEY } from '../../redis/consent.redis';
import { redisClient } from '../../redis/redis';
import { mongooseIUserRef } from '../allUser/typesAndConst';
import { FriendShipModel, IFriendShip } from './friendship.interface';

const FriendShipSchema = new Schema<IFriendShip, FriendShipModel>(
  {
    sender: mongooseIUserRef,
    receiver: mongooseIUserRef,
    block: {
      isBlock: {
        type: String,
        enum: YN_ARRAY,
        default: ENUM_YN.NO,
      },
      lastBlockDate: Date,
      reason: {
        type: String,
        trim: true,
      },
      blocker: mongooseIUserRef,
    },
    lastMessage: {
      message: String,
      messageId: {
        type: Schema.Types.ObjectId,
        ref: 'Message',
      },
      createdAt: Date,
    },
    requestAccept: {
      type: String,
      enum: YN_ARRAY,
      default: ENUM_YN.YES,
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
FriendShipSchema.statics.isFriendShipExistMethod = async function (
  id: string,
  option?: {
    isDelete?: boolean;
    populate?: boolean;
  },
): Promise<IFriendShip | null> {
  let data;
  if (!option?.populate) {
    const result = await FriendShip.aggregate([
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
          roleMatchFiledName: 'sender.role',
          idFiledName: 'sender.roleBaseUserId', //$sender.roleBaseUserId
          pipeLineMatchField: '_id', //$_id
          outPutFieldName: 'details',
          margeInField: 'sender',
          //project: { name: 1, country: 1, profileImage: 1, email: 1 },
        },
        {
          roleMatchFiledName: 'receiver.role',
          idFiledName: 'receiver.roleBaseUserId', //$receiver.roleBaseUserId
          pipeLineMatchField: '_id', //$_id
          outPutFieldName: 'details',
          margeInField: 'receiver',
          //project: { name: 1, country: 1, profileImage: 1, email: 1 },
        },
      ],
    });

    const result = await FriendShip.aggregate(pipeline);

    data = result[0];
  }
  return data;
};
// before save then data then call this hook
/*
 FriendShipSchema.pre('save', async function (next) {
  try {
    const data = this;
    const FriendShipModel = this.constructor as FriendShipModel; // Explicit cast
    const existing = await FriendShipModel.findOne({
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
FriendShipSchema.post('save', async function (data: IFriendShip, next: any) {
  try {
    await redisClient().set(
      ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP + data?._id,
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
FriendShipSchema.post(
  'findOneAndUpdate',
  async function (data: IFriendShip, next: any) {
    try {
      await redisClient().set(
        ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP + data?._id,
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
FriendShipSchema.post(
  'findOneAndDelete',
  async function (data: IFriendShip, next: any) {
    try {
      await redisClient().del(
        ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP + data?._id,
      );
      next();
    } catch (error: any) {
      next(error);
    }
  },
);

export const FriendShip = model<IFriendShip, FriendShipModel>(
  'FriendShip',
  FriendShipSchema,
);
