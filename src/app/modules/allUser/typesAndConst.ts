import { Schema, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../global/enum_constant_type';
import { IFileAfterUpload } from '../../interface/fileUpload';
import { I_USER_ROLE, IUser, USER_ROLE_ARRAY } from './user/user.interface';
//
export type IGender = 'male' | 'female' | 'other';
export const GENDER_ARRAY = ['male', 'female', 'other'];

export type ILocation = {
  link?: string;
  latitude?: number;
  longitude?: number;
  coordinates: number[]; // first -> longitude,latitude
  type: string | 'Point';
};
//-------------------IUserRef-----------------
/* 
export type IUserRef = {
  role: I_USER_ROLE;
  userId: string | Types.ObjectId;
  roleBaseUserId: string | Types.ObjectId;
};
*/

export const mongooseIUserRef = new Schema<IUserRef>(
  {
    role: { type: String, enum: USER_ROLE_ARRAY },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    roleBaseUserId: { type: Schema.Types.ObjectId },
  },
  {
    _id: false,
  },
);
export const zodRefUser = z.object({
  role: z.enum(USER_ROLE_ARRAY as [I_USER_ROLE]),
  // userId: z.union([z.string(), z.instanceof(Types.ObjectId)]),
  userId: z.string().or(z.instanceof(Types.ObjectId)),
  roleBaseUserId: z.union([z.string(), z.instanceof(Types.ObjectId)]),
});
export type IUserRef = z.infer<typeof zodRefUser>;
export type IUserRefAndDetails = IUserRef & { details: IUser };
//--------------------------------------------
//
export const VERIFY_ARRAY = ['pending', 'accept', 'cancel'];
export type I_VERIFY = 'pending' | 'accept' | 'cancel';
export enum ENUM_VERIFY {
  PENDING = 'pending',
  ACCEPT = 'accept',
  CANCEL = 'cancel',
}
//
export type ICommonUser = {
  _id: string;
  userUniqueId: string;
  // fullName: string;
  name: {
    firstName: string;
    lastName: string;
  };
  email: string;
  contactNumber: string;
  gender: IGender;
  dateOfBirth?: string;
  address?: string;
  profileImage?: IFileAfterUpload;
  authentication?: {
    otp: number;
    timeOut: string;
    jwtToken?: string;
  };
  author?: IUserRef;
  status: I_STATUS;
  isDelete: boolean;
};
