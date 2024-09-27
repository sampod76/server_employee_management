import mongoose, { Schema, model } from 'mongoose';

import { ENUM_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { mongooseFileSchema } from '../../../global/schema/global.schema';
import ApiError from '../../errors/ApiError';
import {
  AllTextFieldModel,
  DATA_TYPE_ARRAY,
  IAllTextField,
} from './interface.AllTextField';
const AllTextFieldSchema = new Schema<IAllTextField, AllTextFieldModel>(
  {
    heading: {
      type: String,
      trim: true,
    },
    bodyData: {
      type: Object,
      default: {},
    },
    htmlText: {
      type: String,
      // required: true,
      trim: true,
    },
    image: mongooseFileSchema,

    dataType: {
      type: String,
      enum: DATA_TYPE_ARRAY,
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
    //--- for --TrashAllTextField---
    oldRecord: {
      refId: { type: Schema.Types.ObjectId, ref: 'AllTextField' },
      collection: String,
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

AllTextFieldSchema.pre('findOneAndDelete', async function (next) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dataId = this.getFilter();
    //  console.log(dataId); //{ _id: '6607a2b70d0b8a202a1b81b4' }
    const { _id, ...data } = (await this.model
      .findOne({ _id: dataId?._id })
      .lean()) as { _id: mongoose.Schema.Types.ObjectId; data: any };
    // console.log('🚀 ~ file: model.AllTextField.ts:40 ~ _id:', data);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    if (!data?.oldRecord?.refId) {
      if (_id) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { status, isDelete, createdAt, updatedAt, ...otherData } = data;
        await TrashAllTextField.create({
          ...otherData,
          oldRecord: { refId: _id, collection: 'categories' },
        });
        // or
        // const result = await DeleteAllTextField.create(data);
      } else {
        throw new ApiError(400, 'Not found this item');
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

export const AllTextField = model<IAllTextField, AllTextFieldModel>(
  'AllTextField',
  AllTextFieldSchema,
);
export const TrashAllTextField = model<IAllTextField, AllTextFieldModel>(
  'TrashAllTextField',
  AllTextFieldSchema,
);
