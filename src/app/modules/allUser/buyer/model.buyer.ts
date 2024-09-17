import { model, PipelineStage, Schema, Types } from 'mongoose';

import {
  ENUM_STATUS,
  ENUM_YN,
  I_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../../global/enum_constant_type';
import { mongooseFileSchema } from '../../../../global/schema/global.schema';
import {
  ENUM_VERIFY,
  GENDER_ARRAY,
  mongooseIUserRef,
  VERIFY_ARRAY,
} from '../typesAndConst';
import { BuyerUserModel, IBuyerUser } from './interface.buyer';
import { LookupReusable } from '../../../../helper/lookUpResuable';

const BuyerUserSchema = new Schema<IBuyerUser, BuyerUserModel>(
  {
    userUniqueId: {
      type: String,
      required: true,
      // unique: true,
    },

    address: { area: { type: String, trim: true } },
    name: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      // unique: true,
      trim: true,
      index: true,
    },
    biography: {
      type: String,
      trim: true,
    },
    country: {
      name: { type: String, trim: true },
      flag: { url: String },
      isoCode: String,
    },
    // userName: { type: String, trim: true },
    contactNumber: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      trim: true,
    },
    gender: {
      type: String,
      enum: GENDER_ARRAY,
    },

    profileImage: mongooseFileSchema,

    verify: {
      type: String,
      enum: VERIFY_ARRAY,
      default: ENUM_VERIFY.ACCEPT,
    },

    author: mongooseIUserRef,
    status: {
      type: String,
      enum: STATUS_ARRAY,
      default: ENUM_STATUS.ACTIVE,
    },
    isDelete: {
      type: String,
      enum: YN_ARRAY,
      default: ENUM_YN.NO,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

BuyerUserSchema.statics.isBuyerUserExistMethod = async function (
  id: string,
  option?: Partial<{
    isDelete: I_YN;
    populate: boolean;
    needProperty?: string[];
  }>,
): Promise<IBuyerUser | null> {
  let user;
  if (!option?.populate) {
    const result = await BuyerUser.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDelete: option?.isDelete || ENUM_YN.NO,
        },
      },
      {
        $project: { password: 0 },
      },
    ]);
    user = result[0];
  } else {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDelete: option.isDelete || ENUM_YN.NO,
        },
      },
    ];
    LookupReusable(pipeline, {
      collections: [
        {
          connectionName: 'users',
          idFiledName: 'email',
          pipeLineMatchField: 'email',
          outPutFieldName: 'userDetails',
        },
      ],
    });
    const result = await BuyerUser.aggregate(pipeline);
    user = result[0];
  }
  return user;
};

export const BuyerUser = model<IBuyerUser, BuyerUserModel>(
  'Buyer',
  BuyerUserSchema,
);
