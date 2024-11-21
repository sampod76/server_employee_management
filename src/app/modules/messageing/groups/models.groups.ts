import { model, PipelineStage, Schema, Types } from 'mongoose';

import {
  ENUM_STATUS,
  STATUS_ARRAY,
} from '../../../../global/enum_constant_type';

import { mongooseFileSchema } from '../../../../global/schema/global.schema';
import { LookupAnyRoleDetailsReusable } from '../../../../helper/lookUpResuable';
import { ENUM_REDIS_KEY } from '../../../redis/consent.redis';
import { redisClient } from '../../../redis/redis';
import { mongooseIUserRef } from '../../allUser/typesAndConst';
import { GroupsModel, IGroups } from './interface.groups';

const GroupsSchema = new Schema<IGroups, GroupsModel>(
  {
    // gigId: { type: Schema.Types.ObjectId, ref: 'Gig' },
    author: mongooseIUserRef,
    name: { type: String },
    project: {
      projectStart: { type: Date },
      projectDeadline: { type: Date },
      title: { type: String },
      description: { type: String },
      price: { type: Number },
    },
    //when completed payment then set members
    members: {
      total: { type: Number },
    },
    coverImage: mongooseFileSchema,
    profileImage: mongooseFileSchema,
    cs_id: { type: String }, //when buyer try payment first time create session then set session to session.id-->  cs_id
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    //
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
GroupsSchema.statics.isGroupsExistMethod = async function (
  id: string,
  option?: {
    isDelete?: boolean;
    populate?: boolean;
    project?: Record<string, number>;
    needProperty?: string[];
  },
): Promise<IGroups | null> {
  let data;
  if (!option?.populate) {
    const result = await Groups.aggregate([
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

    const result = await Groups.aggregate(pipeline);

    data = result[0];
  }
  return data;
};
// before save then data then call this hook
/*
 GroupsSchema.pre('save', async function (next) {
  try {
    const data = this;
    const GroupsModel = this.constructor as GroupsModel; // Explicit cast
    const existing = await GroupsModel.findOne({
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
GroupsSchema.post('save', async function (data: IGroups, next: any) {
  try {
    await redisClient.set(
      ENUM_REDIS_KEY.RIS_Groups + data?._id,
      JSON.stringify(data),
      'EX',
      24 * 60 * 60, // 1 day to second
    );

    next();
  } catch (error: any) {
    next(error);
  }
});
// after findOneAndUpdate then data then call this hook
GroupsSchema.post(
  'findOneAndUpdate',
  async function (data: IGroups, next: any) {
    try {
      await redisClient.set(
        ENUM_REDIS_KEY.RIS_Groups + data?._id + data?._id,
        JSON.stringify(data),
        'EX',
        24 * 60 * 60, // 1 day to second
      );

      next();
    } catch (error: any) {
      next(error);
    }
  },
);
// after findOneAndDelete then data then call this hook
GroupsSchema.post(
  'findOneAndDelete',
  async function (data: IGroups, next: any) {
    try {
      await redisClient.del([ENUM_REDIS_KEY.RIS_Groups + data?._id]);
      next();
    } catch (error: any) {
      next(error);
    }
  },
);

export const Groups = model<IGroups, GroupsModel>('Groups', GroupsSchema);
