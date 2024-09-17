import { Schema, model } from 'mongoose';

import {
  ENUM_STATUS,
  ENUM_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../../global/enum_constant_type';
import { mongooseFileSchema } from '../../../../global/schema/global.schema';
import { GENDER_ARRAY, mongooseIUserRef } from '../typesAndConst';
import { AdminModel, IAdmin } from './admin.interface';

const adminSchema = new Schema<IAdmin, AdminModel>(
  {
    userUniqueId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      firstName: { type: String },
      lastName: { type: String },
    },
    // name: {
    //   firstName: { type: String },
    //   lastName: { type: String },
    // },
    email: {
      type: String,
      required: true,
      lowercase: true,
      // unique: true,
      trim: true,
      index: true,
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
    author: mongooseIUserRef,

    profileImage: mongooseFileSchema,

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

export const Admin = model<IAdmin, AdminModel>('Admin', adminSchema);