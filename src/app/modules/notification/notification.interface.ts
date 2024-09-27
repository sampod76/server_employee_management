import { Model, Types } from 'mongoose';

import { IUser, I_USER_ROLE } from '../allUser/user/user.interface';

import { I_STATUS, I_YN } from '../../../global/enum_constant_type';
import { IFileAfterUpload } from '../../interface/fileUpload';

export type INotificationFilters = {
  userId?: string;
  role?: string;
  //
  searchTerm?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: boolean | string;
};

export type INotification = {
  // toObject(): unknown;
  userIds?: Array<Types.ObjectId | string | IUser>;
  role?: I_USER_ROLE;
  subject?: string;
  image?: IFileAfterUpload;
  bodyText: string;
  isSeen?: I_YN;
  status?: I_STATUS;
  isDelete?: boolean | string;
};

export type NotificationModel = Model<INotification, Record<string, unknown>>;
