import { Schema, model } from 'mongoose';

import { INotification, NotificationModel } from './notification.interface';

import { ENUM_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { mongooseFileSchema } from '../../../global/schema/global.schema';
import { USER_ROLE_ARRAY } from '../allUser/user/user.interface';

const NotificationSchema = new Schema<INotification>(
  {
    userIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    subject: {
      type: String,
      trim: true,
    },
    bodyText: {
      type: String,
      trim: true,
    },
    role: { type: String, enum: USER_ROLE_ARRAY },
    image: mongooseFileSchema,
    isSeen: {
      type: Boolean,
      default: false,
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
    toJSON: { virtuals: true },
  },
);

export const Notification = model<INotification, NotificationModel>(
  'Notification',
  NotificationSchema,
);
