/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import bcrypt from 'bcrypt';
import { Request } from 'express';
import { JwtPayload, Secret } from 'jsonwebtoken';
import { Types } from 'mongoose';
import config from '../../../config';

import httpStatus from 'http-status';
import qrcode from 'qrcode';
import speakeasy from 'speakeasy';
import { ENUM_STATUS } from '../../../global/enum_constant_type';
import { jwtHelpers } from '../../../helper/jwtHelpers';
import {
  decryptCryptoData,
  encryptCryptoData,
} from '../../../utils/cryptoEncryptDecrypt';
import { sendMailHelper } from '../../../utils/sendMail';
import ApiError from '../../errors/ApiError';
import { IEmployeeUser } from '../allUser/employee/interface.employee';
import { ENUM_VERIFY, IUserRefAndDetails } from '../allUser/typesAndConst';
import { IUser } from '../allUser/user/user.interface';
import { User } from '../allUser/user/user.model';
import { IUserLoginHistory } from '../loginHistory/loginHistory.interface';
import { UserLoginHistory } from '../loginHistory/loginHistory.model';
import {
  IChangePassword,
  ILoginUser,
  ILoginUserResponse,
  IRefreshTokenResponse,
} from './auth.interface';
const loginUser = async (
  payload: ILoginUser,
  req: Request,
): Promise<ILoginUserResponse | any> => {
  const { email, password } = payload;

  const isUserExist = (await User.isUserFindMethod(
    { email },
    { populate: true, password: true },
  )) as IUser & { roleInfo: IEmployeeUser };
  // console.log('🚀 ~ isUserExist:', isUserExist);
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'User does not exist');
  } else if (isUserExist.isDelete) {
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'The account is deleted');
  } else if (isUserExist.status === ENUM_STATUS.INACTIVE) {
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Your account is inactive');
  } else if (isUserExist.status === ENUM_STATUS.BLOCK) {
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, `Your account is blocked`);
    //@ts-ignore
  } else if (isUserExist.roleInfo.verify !== ENUM_VERIFY.ACCEPT) {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      //@ts-ignore
      `Your account is ${isUserExist.roleInfo.verify} state`,
    );
  } else if (
    isUserExist.password &&
    !(await User.isPasswordMatchMethod(password, isUserExist.password))
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Password is incorrect');
  }

  //create access token & refresh token
  const { role, _id, roleInfo, userUniqueId } = isUserExist as any;

  const accessToken = jwtHelpers.createToken(
    { role, userId: _id, roleBaseUserId: roleInfo._id },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string,
  );

  const refreshToken = jwtHelpers.createToken(
    { role, userId: _id, roleBaseUserId: roleInfo._id },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
    userData: {
      role,
      roleBaseUserId: roleInfo._id,
      userId: _id,
      userUniqueId,
      email,
      name: roleInfo.name,
      profileImage: roleInfo.profileImage,
    },
  };
};
const loginOutFromDb = async (
  req: Request,
): Promise<IUserLoginHistory | null> => {
  const { id } = req.params;

  const checkLoginHistory = await UserLoginHistory.findOne({
    //@ts-ignore
    user: req?.user?.userId,
    user_agent: req.headers['user-agent'],
    token: req?.cookies?.refreshToken,
  });
  let result = null;
  if (checkLoginHistory) {
    // result = await UserLoginHistory.findOneAndUpdate(
    //   { _id: id },
    //   { isDelete: true },
    // );
    result = await UserLoginHistory.findByIdAndDelete(id);
  } else {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to');
  }

  // const result = await UserLoginHistory.findByIdAndDelete(id);

  return result;
};
const enableTwoFactorAuthFromDb = async (
  data: { password: string },
  user: IUserRefAndDetails,
): Promise<{
  secret_key: string;
  secret: speakeasy.GeneratedSecret;
  qrCodeUrl: string;
} | null> => {
  const isUserExist = await User.isUserFindMethod(
    { email: user.details.email },
    { populate: true, password: true },
  );
  if (
    isUserExist.password &&
    !(await User.isPasswordMatchMethod(data?.password, isUserExist.password))
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Password is incorrect');
  }
  // Generate a secret for the user--> any object
  const secret = speakeasy.generateSecret({
    name: `dr-marzen: ${user.details.email} `, // when add google authenticator --> then show this name
    length: 20,
  });
  await User.findByIdAndUpdate(user.userId, {
    secret: encryptCryptoData(secret.base32, config.crypto_key as string),
  });
  const qrcodeUrl = await qrcode.toDataURL(secret.otpauth_url as string);
  return {
    secret_key: secret.base32,
    qrCodeUrl: qrcodeUrl, //base64 image in qrcode
    secret,
  };
};

const verifyTwoFactorAuthFromDb = async (
  data: { otp: any },
  user: IUserRefAndDetails,
): Promise<boolean | null> => {
  const isExist = await User.isUserFindMethod(
    { id: user.userId.toString() },
    {},
  );

  const isVerify = speakeasy.totp.verify({
    secret: decryptCryptoData(isExist.secret, config.crypto_key as string),
    encoding: 'base32',
    token: data.otp,
  });
  if (!isVerify) {
    throw new ApiError(httpStatus.FORBIDDEN, 'OTP is incorrect'); // OTP is incorrect - synchronous
  }
  return isVerify;
};

const refreshToken = async (
  token: string,
  req: Request,
): Promise<IRefreshTokenResponse> => {
  //verify token
  // invalid token - synchronous
  let verifiedToken = null;
  // console.log(token, 'token');
  try {
    verifiedToken = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_secret as Secret,
    );
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Refresh Token');
  }
  const user_agent = req.headers['user-agent'];
  const { userId } = verifiedToken;

  const promises = [
    User.isUserFindMethod({ id: userId }, { populate: true, password: true }),
    UserLoginHistory.findOne({
      userId: new Types.ObjectId(userId),
      // user_agent: user_agent,
      token: token,
      isDelete: false,
    }),
  ];
  const resolver = (await Promise.all(promises)) as [
    IUser | null,
    IUserLoginHistory | null,
  ];

  const isUserExist = resolver[0] as IUser;
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }
  // checking old password
  else if (isUserExist.status === ENUM_STATUS.INACTIVE) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Your account is deactivated');
  } else if (isUserExist.isDelete) {
    throw new ApiError(httpStatus.NOT_FOUND, `Your account is deleted`);
  } else if (isUserExist.status === ENUM_STATUS.BLOCK) {
    throw new ApiError(httpStatus.NOT_FOUND, `Your account is blocked`);
  }

  const checkLoginHistory = resolver.length && resolver[1];

  if (!checkLoginHistory) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Unauthorized.Please login again');
  }
  if (checkLoginHistory.status === ENUM_STATUS.INACTIVE) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Unauthorized.Inactive Please login again',
    );
  } else if (checkLoginHistory.status === ENUM_STATUS.BLOCK) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Unauthorized.Block Please login again',
    );
  }
  const { role, _id, roleInfo, userUniqueId } = isUserExist as any;
  const newAccessToken = jwtHelpers.createToken(
    { role, userId: _id, roleBaseUserId: roleInfo._id },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string,
  );

  return {
    accessToken: newAccessToken,
  };
};

const changePassword = async (
  user: JwtPayload | null,
  payload: IChangePassword,
  req: Request,
): Promise<void> => {
  const { oldPassword, newPassword } = payload;

  // // checking is user exist
  // const isUserExist = await User.isUserExist(user?.userId);

  //alternative way
  const isUserExist = (await User.findOne({
    _id: user?.userId,
    isDelete: false,
  }).select('+password')) as any;

  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }

  if (isUserExist?._id?.toString() !== user?.userId) {
    throw new ApiError(403, 'forbidden access');
  }
  // checking old password
  else if (isUserExist.status === ENUM_STATUS.INACTIVE) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Your account is deactivated');
  } else if (isUserExist.isDelete) {
    throw new ApiError(httpStatus.NOT_FOUND, `Your account is deleted`);
  }
  //  else if (isUserExist.status === ENUM_STATUS.BLOCK) {
  //   throw new ApiError(
  //     httpStatus.NOT_FOUND,
  //     `Your account is blocked ${isUserExist?.blockingTimeout}`,
  //   );
  // }
  if (
    isUserExist.password &&
    !(await User.isPasswordMatchMethod(oldPassword, isUserExist.password))
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Old Password is incorrect');
  }

  // // hash password before saving
  const newHashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bycrypt_salt_rounds),
  );

  const query = { _id: user?.userId };
  const updatedData = {
    password: newHashedPassword, //
  };
  await User.findOneAndUpdate(query, updatedData);

  // data update
  // isUserExist.password = newPassword;
  // isUserExist.needsPasswordChange = false;

  // updating using save()
  // isUserExist.save();
};

const forgotPass = async (payload: { email: string }, req: Request) => {
  const profile = (await User.findOne({ email: payload.email })) as IUser & {
    _id: Types.ObjectId;
  };

  // let profile = null;
  // if (user.role === ENUM_USER_ROLE.admin) {
  //   profile = await Admin.findById(user.id);
  // } else if (user.role === ENUM_USER_ROLE.MODERATOR) {
  //   profile = await Moderator.findById(user.id);
  // } else if (user.role === ENUM_USER_ROLE.student) {
  //   profile = await Student.findById(user.id);
  // }

  // if (!profile) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Pofile not found!');
  // }

  if (!profile?.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email not found!');
  } else if (profile.status === ENUM_STATUS.INACTIVE) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Your account is deactivated');
  } else if (profile.isDelete) {
    throw new ApiError(httpStatus.NOT_FOUND, `Your account is deleted`);
  }

  const passResetToken = await jwtHelpers.createResetToken(
    { email: profile.email, role: profile.role, id: profile._id },
    config.jwt.forgetPassword as string,
    '50m',
  );

  const resetLink: string =
    config.resetlink + `${profile._id}?token=${passResetToken}`;

  const currentTime = new Date();

  // Calculate expiry time by adding 5 minutes to the current time
  const expiryTime = new Date(currentTime.getTime() + 5 * 60000);
  const authData = {
    otp: Math.floor(100000 + Math.random() * 900000),
    timeOut: expiryTime,
    jwtToken: passResetToken,
    status: ENUM_STATUS.ACTIVE,
  };

  // console.log('profile: ', profile);
  const result = {
    receiver_email: profile.email,
    title: 'Forget Password',
    subject: 'Forget Password',
    body_text: ` <div style="text-align: center;">
    <h1 style=" padding: 10px 15px; background-color: #2ecc71; color: #fff; text-decoration: none; border-radius: 5px;">${authData.otp}</h1>
  </div>`,
    data: {
      reset_link: resetLink,
      otp: authData.otp,
      time_out: authData.timeOut,
    },
    footer_text: ` <div style="text-align: center;">
    <p>Expiry time: ${authData?.timeOut?.toLocaleTimeString()}</p>
  </div>`,
  };
  //
  // const job = await emailQueue.add(ENUM_QUEUE_NAME.email, result);
  const send = await sendMailHelper(result);
  //!--if you want to wait then job is completed then use it
  // const queueResult = await checkEmailQueueResult(job.id as string);
  await User.findOneAndUpdate(
    {
      _id: profile._id,
    },
    { authentication: authData },
  );

  return result;
};

const checkOtpFromDb = async (
  payload: { email: string; otp: number },
  req: Request,
) => {
  const { email, otp } = payload;
  const profile = (await User.findOne({ email: email })) as IUser & {
    _id: Types.ObjectId;
  };

  if (!profile?._id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found!');
  }

  // if (profile?.authentication?.status !== ENUM_STATUS.ACTIVE) {
  //   throw new ApiError(
  //     httpStatus.NOT_FOUND,
  //     'Authentication code not found. Please send an OTP request',
  //   );
  // }
  if (profile?.authentication?.otp !== Number(otp)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Otp not matching');
  }
  if (
    profile?.authentication?.timeOut &&
    new Date(profile?.authentication?.timeOut).getTime() < Date.now()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP has expired');
  }

  const result = await User.findOneAndUpdate(
    { email },
    { 'authentication.status': ENUM_STATUS.INACTIVE }, //not change because token is need verification
  );

  return result;
};

const tokenToSetPasswordFromDb = async (
  data: {
    resetPasswordToken: string;
    newPassword: string;
  },
  req: Request,
) => {
  const token = data.resetPasswordToken;
  let verifiedUser;
  try {
    verifiedUser = jwtHelpers.verifyToken(
      token,
      config.jwt.forgetPassword as Secret,
    );
  } catch (error) {
    throw new ApiError(403, 'forbidden access');
  }

  if (!verifiedUser.id) {
    throw new ApiError(403, 'forbidden access');
  }

  const modifyPassword = await bcrypt.hash(
    data.newPassword,
    Number(config.bycrypt_salt_rounds),
  );
  const userData = await User.findById(verifiedUser.id);
  if (userData?.authentication?.jwtToken !== token) {
    throw new ApiError(403, 'forbidden access token is expired');
  }

  await User.findOneAndUpdate(
    { _id: verifiedUser.id },
    {
      password: modifyPassword,
      authentication: { token: '', status: ENUM_STATUS.INACTIVE },
      // $unset:{authentication:""}
    },
  );
};

export const AuthService = {
  loginUser,
  loginOutFromDb,
  refreshToken,
  changePassword,
  //
  forgotPass,
  checkOtpFromDb,
  tokenToSetPasswordFromDb,
  //
  enableTwoFactorAuthFromDb,
  verifyTwoFactorAuthFromDb,
};
