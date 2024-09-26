import mongoose, { Schema, model } from 'mongoose';

import { ENUM_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { mongooseFileSchema } from '../../../global/schema/global.schema';
import ApiError from '../../errors/ApiError';
import {
  AdminSettingModel,
  AdminSettingTypeArray,
  IAdminSetting,
  PaymentTimeTypeArray,
} from './interface.adminSetting';
const AdminSettingSchema = new Schema<IAdminSetting, AdminSettingModel>(
  {
    settingType: {
      type: String,
      enum: AdminSettingTypeArray,
    },
    percentageValue: {
      type: Number,
      min: 0,
      max: 100,
      required: false,
    },
    title: {
      type: String,
      trim: true,
    },
    image: mongooseFileSchema,
    paymentTime: {
      type: {
        number: {
          type: Number,
          min: 0,
          required: false,
        },
        timeType: {
          type: String,
          enum: PaymentTimeTypeArray,
        },
      },
    },
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
    // strict: 'throw',
    toJSON: {
      virtuals: true,
    },
  },
);

AdminSettingSchema.pre('findOneAndDelete', async function (next) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dataId = this.getFilter();
    //  console.log(dataId); //{ _id: '6607a2b70d0b8a202a1b81b4' }
    const { _id, ...data } = (await this.model
      .findOne({ _id: dataId?._id })
      .lean()) as { _id: mongoose.Schema.Types.ObjectId; data: any };
    // console.log('🚀 ~ file: model.AdminSetting.ts:40 ~ _id:', data);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    if (!data?.oldRecord?.refId) {
      if (_id) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { status, isDelete, createdAt, updatedAt, ...otherData } = data;
        await TrashAdminSetting.create({
          ...otherData,
          oldRecord: { refId: _id, collection: 'categories' },
        });
        // or
        // const result = await DeleteAdminSetting.create(data);
      } else {
        throw new ApiError(400, 'Not found this item');
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

export const AdminSetting = model<IAdminSetting, AdminSettingModel>(
  'AdminSetting',
  AdminSettingSchema,
);
export const TrashAdminSetting = model<IAdminSetting, AdminSettingModel>(
  'TrashAdminSetting',
  AdminSettingSchema,
);
