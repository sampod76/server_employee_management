import {
  CallbackWithoutResultAndOptionalError,
  model,
  PipelineStage,
  Schema,
  Types,
} from 'mongoose';

import {
  ENUM_STATUS,
  STATUS_ARRAY,
} from '../../../../global/enum_constant_type';
import { mongooseFileSchema } from '../../../../global/schema/global.schema';
import { LookupReusable } from '../../../../helper/lookUpResuable';
import {
  ENUM_VERIFY,
  GENDER_ARRAY,
  mongooseIUserRef,
  VERIFY_ARRAY,
} from '../typesAndConst';
import { HrAdminUserModel, IHrAdminUser } from './interface.hrAdmin';

const HrAdminSchema = new Schema<IHrAdminUser, HrAdminUserModel>(
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
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

HrAdminSchema.statics.isHrAdminExistMethod = async function (
  id: string,
  option?: Partial<{
    isDelete: boolean;
    populate: boolean;
    needProperty?: string[];
  }>,
): Promise<IHrAdminUser | null> {
  let user;
  if (!option?.populate) {
    const result = await HrAdmin.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDelete: option?.isDelete || false,
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
          isDelete: option.isDelete || false,
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
          project: { password: 0 },
        },
      ],
    });
    const result = await HrAdmin.aggregate(pipeline);
    user = result[0];
  }
  return user;
};

HrAdminSchema.pre(
  'save',
  async function (next: CallbackWithoutResultAndOptionalError) {
    try {
      // const HrAdmin = this;
      // const existUser = await HrAdmin.findOne({ userName: HrAdmin?.userName });
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

export const HrAdmin = model<IHrAdminUser, HrAdminUserModel>(
  'HrAdmin',
  HrAdminSchema,
);
