import { model, PipelineStage, Schema, Types } from 'mongoose';

import {
  ENUM_STATUS,
  STATUS_ARRAY,
} from '../../../../global/enum_constant_type';

import { LookupAnyRoleDetailsReusable } from '../../../../helper/lookUpResuable';
import { ENUM_REDIS_KEY } from '../../../redis/consent.redis';
import { redisClient } from '../../../redis/redis';
import { mongooseIUserRef } from '../../allUser/typesAndConst';
import { FriendShipModel, IFriendShip } from './friendship.interface';

const FriendShipSchema = new Schema<IFriendShip, FriendShipModel>(
  {
    sender: mongooseIUserRef,
    receiver: mongooseIUserRef,
    //
    gigId: { type: Schema.Types.ObjectId, ref: 'Gig' },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    block: {
      isBlock: {
        type: Boolean,
        default: false,
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
      type: Boolean,
      default: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
      index: true,
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
    project?: Record<string, number>;
    needProperty?: string[];
  },
): Promise<IFriendShip | null> {
  let data;
  if (!option?.populate) {
    const result = await FriendShip.aggregate([
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
          roleMatchFiledName: 'sender.role',
          idFiledName: 'sender.roleBaseUserId', //$sender.roleBaseUserId
          pipeLineMatchField: '_id', //$_id
          outPutFieldName: 'details',
          margeInField: 'sender',
          project: option.project ? option.project : { __v: 0 },
          //project: { name: 1, country: 1, profileImage: 1, email: 1 },
        },
        {
          roleMatchFiledName: 'receiver.role',
          idFiledName: 'receiver.roleBaseUserId', //$receiver.roleBaseUserId
          pipeLineMatchField: '_id', //$_id
          outPutFieldName: 'details',
          margeInField: 'receiver',
          project: option.project ? option.project : { __v: 0 },
          //project: { name: 1, country: 1, profileImage: 1, email: 1 },
        },
      ],
    });
    // if (option?.needProperty?.includes('isOnline')) {

    // }

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
    /* // --baseuse frindShip data in populate details-- but this details in not details
     await redisClient.set(
      ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP + data?._id,
      JSON.stringify(data),
      'EX',
      24 * 60 * 60, // 1 day to second
    ); 
    */
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
      // await redisClient.set(
      //   ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP + data?._id,
      //   JSON.stringify(data),
      //   'EX',
      //   24 * 60 * 60, // 1 day to second
      // );
      //
      /*  // --baseuse frindShip data in populate details-- but this details in not details
     const whenMySender =
        ENUM_REDIS_KEY.RIS_senderId_receiverId +
        `:${data.receiver.userId}:${data.sender.userId}`;
      const whenMyReceiver =
        ENUM_REDIS_KEY.RIS_senderId_receiverId +
        `:${data.sender.userId}:${data.receiver.userId}`;
      //
      await redisSetter<IFriendShip>([
        { key: whenMySender, value: data, ttl: 24 * 60 * 60 },
        { key: whenMyReceiver, value: data, ttl: 24 * 60 * 60 },
        {
          key: ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP + data?._id,
          value: data,
          ttl: 24 * 60 * 60,
        },
      ]);
       */
      const delDate = [ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP + data?._id];
      if (data?.receiver?.userId) {
        const whenMySender =
          ENUM_REDIS_KEY.RIS_senderId_receiverId +
          `:${data.receiver.userId}:${data.sender.userId}`;
        delDate.push(whenMySender);
      }
      if (data?.sender?.userId) {
        const whenMyReceiver =
          ENUM_REDIS_KEY.RIS_senderId_receiverId +
          `:${data.sender.userId}:${data.receiver.userId}`;
        delDate.push(whenMyReceiver);
      }
      //
      await redisClient.del(delDate);
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
      //
      const whenMySender =
        ENUM_REDIS_KEY.RIS_senderId_receiverId +
        `:${data.receiver.userId}:${data.sender.userId}`;
      const whenMyReceiver =
        ENUM_REDIS_KEY.RIS_senderId_receiverId +
        `:${data.sender.userId}:${data.receiver.userId}`;
      //
      await redisClient.del([
        whenMySender,
        whenMyReceiver,
        ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP + data?._id,
      ]);
      // await redisClient.del(
      //   ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP + data?._id,
      // );
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
