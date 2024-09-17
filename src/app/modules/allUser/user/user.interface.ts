import { Model } from 'mongoose';
import { z } from 'zod';
import {
  I_SOCKET_STATUS,
  I_STATUS,
  I_YN,
} from '../../../../global/enum_constant_type';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import { ILocation } from '../typesAndConst';
import { authData } from './user.validation';

export type IGender = 'male' | 'female' | 'other';
//
export const USER_ROLE_ARRAY = Object.values(ENUM_USER_ROLE);
export type I_USER_ROLE = keyof typeof ENUM_USER_ROLE;
//
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
export type IUser = z.infer<typeof authData> & {
  _id: string;
  userUniqueId: string;
  //--user give
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
};

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
