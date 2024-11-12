import { Schema } from 'mongoose';

import { z } from 'zod';
import {
  IFileAfterUpload,
  I_IMAGE_PLATFORM_ARRAY,
} from '../../app/interface/fileUpload';
import { ILocation } from '../../app/modules/allUser/typesAndConst';
//-------------------------------------------------------------
export const mongooseFileSchema = new Schema<IFileAfterUpload>(
  {
    url: String,
    durl: String,
    mimetype: String,
    filename: String,
    fieldname: String,
    server_url: String,
    path: String,
    cdn: String,
    platform: {
      type: String,
      enum: I_IMAGE_PLATFORM_ARRAY,
      default: 'server',
    },
  },
  {
    _id: false,
    timestamps: true,
  },
);
export const zodFileAfterUploadSchema = z.object(
  {
    mimetype: z.string(),
    server_url: z.string().optional(),
    path: z.string().optional(),
    filename: z.string().optional(),
    fieldname: z.string().optional(),
    // url: z.string().optional(),
    url: z.string().optional(),
    cdn: z.string().optional(),
    durl: z.string().optional(),
    platform: z.string(), // Assuming IImagePlatform is a string type
  },
  { required_error: 'File is Required' },
);
//-------------------------------------------------------------
export const mongooseLocationSchema = new Schema<ILocation>(
  {
    link: String,
    latitude: Number,
    longitude: Number,
    coordinates: [Number], // Array of numbers
    type: { type: String, default: 'Point' }, // default value 'Point'
  },
  {
    _id: false,
  },
);

export const zodLocationSchema = z.object({
  link: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  coordinates: z.array(z.number()).length(2), // first -> longitude,latitude
});
//-------------------------------------------------------------

export type IPricing = {
  price: number;
  currency?: string;
  discount?: number;
  vat?: number;
  tax?: number;
};

export const mongoosePricingSchema = new Schema<IPricing>(
  {
    price: { type: Number, min: 0 },
    currency: { type: String, trim: true },
    discount: { type: Number },
    vat: { type: Number },
    tax: { type: Number },
  },
  {
    _id: false,
  },
);
export const zodPricingSchema = z.object({
  price: z.number({ required_error: 'Price is required' }).min(0),
  discount: z.number().min(0).optional(),
  vat: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  currency: z.string().optional(),
});
//------------------------------------------------------------------
