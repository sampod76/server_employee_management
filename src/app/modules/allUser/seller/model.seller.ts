import {
  CallbackWithoutResultAndOptionalError,
  model,
  PipelineStage,
  Schema,
  Types,
} from 'mongoose';

import {
  ENUM_STATUS,
  ENUM_YN,
  I_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../../global/enum_constant_type';
import { mongooseFileSchema } from '../../../../global/schema/global.schema';
import { LookupReusable } from '../../../../helper/lookUpResuable';
import {
  ENUM_VERIFY,
  GENDER_ARRAY,
  mongooseIUserRef,
  VERIFY_ARRAY,
} from '../typesAndConst';
import { ISellerUser, SellerUserModel } from './interface.seller';

const SellerSchema = new Schema<ISellerUser, SellerUserModel>(
  {
    userUniqueId: {
      type: String,
      required: true,
      // unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      // unique: true,
      trim: true,
      index: true,
    },
    name: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
    },
    // userName: { type: String, trim: true },
    address: { area: { type: String, trim: true } },
    country: {
      name: { type: String, trim: true },
      flag: { url: String },
      isoCode: String,
    },
    designation: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    biography: {
      type: String,
      trim: true,
    },
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
      default: ENUM_VERIFY.PENDING,
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

SellerSchema.statics.isSellerExistMethod = async function (
  id: string,
  option?: Partial<{
    isDelete: I_YN;
    populate: boolean;
    needProperty?: string[];
  }>,
): Promise<ISellerUser | null> {
  let user;
  if (!option?.populate) {
    const result = await Seller.aggregate([
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
    const result = await Seller.aggregate(pipeline);
    user = result[0];
  }
  return user;
};

SellerSchema.pre(
  'save',
  async function (next: CallbackWithoutResultAndOptionalError) {
    try {
      // const seller = this;
      // const existUser = await Seller.findOne({ userName: seller?.userName });
      // if (existUser) {
      //   throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'User Name already exist');
      // }
      next();
      // Add your business logic here
    } catch (error: any) {
      next(error);
    }
  },
);

export const Seller = model<ISellerUser, SellerUserModel>(
  'Seller',
  SellerSchema,
);
