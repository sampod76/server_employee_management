import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { IUser } from '../allUser/user/user.interface';

export type ILoginUser = {
  email: string;
  password: string;
};

export type ILoginUserResponse = {
  accessToken: string;
  refreshToken?: string;
  userData?: IUser;
  // needsPasswordChange: boolean;
};

export type IRefreshTokenResponse = {
  accessToken: string;
};

export type ITokenDecodeUser = {
  id: string;
  role: ENUM_USER_ROLE;
  roleBaseUserId: string;
};

export type IChangePassword = {
  oldPassword: string;
  newPassword: string;
};
