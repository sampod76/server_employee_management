import { Model } from 'mongoose';
import {
  I_SOCKET_STATUS,
  I_STATUS,
  I_YN,
} from '../../../../global/enum_constant_type';
import { ILocation, IUserRef } from '../typesAndConst';

export type IGender = 'male' | 'female' | 'other';
export type IBloodGroups =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-';

export const USER_ROLE_ARRAY = ['superAdmin', 'admin', 'buyer', 'seller'];
export type I_USER_ROLE = 'admin' | 'superAdmin' | 'buyer' | 'seller';
export type IUserFilters = {
  searchTerm?: string;
  delete?: I_YN;
  role?: I_USER_ROLE;
  multipleRole?: I_USER_ROLE[];
  status?: I_STATUS;
  isDelete?: I_YN;
  contactNumber?: string;
  needProperty?: string;
  socketStatus?: I_YN;
  //
  latitude?: string;
  longitude?: string;
  maxDistance?: string;
  //
};
type TempUserBody = {
  tempUser: {
    tempUserId: string;
    otp: string;
  };
};
export type IUser = {
  _id: string;
  userUniqueId: string;
  userName?: string;
  //--user give
  email: string;
  role: I_USER_ROLE;
  password: string;
  //
  buyer?: IUserRef;
  seller?: IUserRef;
  //
  authentication?: {
    otp: number;
    jwtToken?: string;
    timeOut: string;
    status: I_STATUS;
  };
  secret: string;
  location?: ILocation;
  status: I_STATUS;
  lastActive?: {
    createdAt: Date;
  };
  socketStatus: I_SOCKET_STATUS;
  isDelete: I_YN;
} & TempUserBody;

export type ITempUser = {
  email: string;
  role: I_USER_ROLE;
};
export type UserModel = {
  isUserFindMethod(
    query: { id?: string; email?: string },
    option: {
      isDelete?: I_YN;
      populate?: boolean;
      password?: boolean;
      needProperty?: string[];
    },
  ): Promise<IUser>;
  isPasswordMatchMethod(
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean | null>;
} & Model<IUser>;
