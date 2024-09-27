import mongoose, { Schema, model } from 'mongoose';

import { ENUM_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { mongooseFileSchema } from '../../../global/schema/global.schema';
import ApiError from '../../errors/ApiError';
import { CategoryModel, ICategory } from './interface.category';
const CategorySchema = new Schema<ICategory, CategoryModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subTitle: {
      type: String,
    },
    image: mongooseFileSchema,
    serialNumber: {
      type: Number,
      default: 9999,
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
    //--- for --TrashCategory---
    oldRecord: {
      refId: { type: Schema.Types.ObjectId, ref: 'Category' },
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

CategorySchema.pre('findOneAndDelete', async function (next) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dataId = this.getFilter();
    //  console.log(dataId); //{ _id: '6607a2b70d0b8a202a1b81b4' }
    const { _id, ...data } = (await this.model
      .findOne({ _id: dataId?._id })
      .lean()) as { _id: mongoose.Schema.Types.ObjectId; data: any };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    if (!data?.oldRecord?.refId) {
      if (_id) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { status, isDelete, createdAt, updatedAt, ...otherData } = data;
        await TrashCategory.create({
          ...otherData,
          oldRecord: { refId: _id, collection: 'categories' },
        });
        // or
        // const result = await DeleteCategory.create(data);
      } else {
        throw new ApiError(400, 'Not found this item');
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

export const Category = model<ICategory, CategoryModel>(
  'Category',
  CategorySchema,
);
export const TrashCategory = model<ICategory, CategoryModel>(
  'TrashCategory',
  CategorySchema,
);
