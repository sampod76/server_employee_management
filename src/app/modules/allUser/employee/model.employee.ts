import { model, PipelineStage, Schema, Types } from 'mongoose';

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
import { EmployeeUserModel, IEmployeeUser } from './interface.employee';

const EmployeeUserSchema = new Schema<IEmployeeUser, EmployeeUserModel>(
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
    documents: [mongooseFileSchema],
    nid: {
      type: String,
      trim: true,
    },
    passport: {
      type: String,
      trim: true,
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

EmployeeUserSchema.statics.isEmployeeUserExistMethod = async function (
  id: string,
  option?: Partial<{
    isDelete: boolean;
    populate: boolean;
    needProperty?: string[];
  }>,
): Promise<IEmployeeUser | null> {
  let user;
  if (!option?.populate) {
    const result = await EmployeeUser.aggregate([
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
    const result = await EmployeeUser.aggregate(pipeline);
    user = result[0];
  }
  return user;
};

export const EmployeeUser = model<IEmployeeUser, EmployeeUserModel>(
  'Employee',
  EmployeeUserSchema,
);
