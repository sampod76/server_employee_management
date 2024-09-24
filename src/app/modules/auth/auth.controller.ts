/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request, Response } from 'express';

import config from '../../../config';

import { getDeviceInfo } from '../../../helper/getDeviceInfo';
import ApiError from '../../errors/ApiError';
import catchAsync from '../../share/catchAsync';
import sendResponse from '../../share/sendResponse';
import { IUserRefAndDetails } from '../allUser/typesAndConst';
import { User } from '../allUser/user/user.model';
import { UserLoginHistory } from '../loginHistory/loginHistory.model';
import { ILoginUserResponse, IRefreshTokenResponse } from './auth.interface';
import { AuthService } from './auth.service';

const loginUser = catchAsync(async (req: Request, res: Response) => {
  console.log(req.body);
  const { refreshToken, userData, ...result } = await AuthService.loginUser(
    req.body,
    req,
  );

  const cookieOptions = {
    secure: config.env === 'development' ? false : true,
    httpOnly: true,
    // maxAge: parseInt(config.jwt.refresh_expires_in || '31536000000'),
    maxAge: 31536000000,
  };

  if (config.env === 'production') {
    //@ts-ignore
    cookieOptions.sameSite = 'none';
  }

  /* 
      
      secure: true,
      httpOnly: true,
      // when my site is same url example: frontend ->sampodnath.com , backend ->sampodnath-api.com. then sameSite lagba na, when frontend ->sampodnath.com , but backend api.sampodnath.com then  sameSite: 'none',
      sameSite: 'none', // or remove this line for testing
      maxAge: 31536000000,
      maxAge: parseInt(config.jwt.refresh_expires_in || '31536000000'), 
      
*/

  //@ts-ignore
  res.cookie('refreshToken', refreshToken, cookieOptions);
  res.cookie('ref', 'refreshTokenUnited', cookieOptions);

  sendResponse<ILoginUserResponse>(req, res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully',
    data: { userData, ...result },
  });
  if (req?.cookies?.refreshToken) {
    const checkLoginHistory = await UserLoginHistory.findOne({
      userId: userData._id,
      user_agent: req.headers['user-agent'],
      token: req?.cookies?.refreshToken,
    });

    if (checkLoginHistory) {
      const ip = req.clientIp;
      await UserLoginHistory.findOneAndUpdate(
        {
          userId: userData.userId,
          user_agent: req.headers['user-agent'],
          token: req?.cookies?.refreshToken,
        },
        {
          ip,
          token: refreshToken,
        },
      );
    } else {
      // ! -------------- set login history function --------------
      const ip = req.clientIp;
      const deviceInfo = getDeviceInfo(req.headers['user-agent'] as string);
      await UserLoginHistory.create({
        ip,
        //@ts-ignore
        userId: userData.userId,
        user_agent: req.headers['user-agent'],
        token: refreshToken,
        device_info: deviceInfo,
      });

      // ! -------------- set login history function end --------------
    }
  } else {
    // ! -------------- set login history function --------------
    const ip = req.clientIp;
    const deviceInfo = getDeviceInfo(req.headers['user-agent'] as string);

    await UserLoginHistory.create({
      ip,
      userId: userData.userId,
      user_agent: req.headers['user-agent'],
      token: refreshToken,
      device_info: deviceInfo,
    });

    // ! -------------- set login history function end --------------
  }
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const { refreshToken: HeaderRefreshToken } = req.headers;

  const result = await AuthService.refreshToken(
    refreshToken || HeaderRefreshToken,
    req,
  );

  const cookieOptions = {
    secure: config.env === 'development' ? false : true,
    httpOnly: true,
    // maxAge: parseInt(config.jwt.refresh_expires_in || '31536000000'),
    maxAge: 31536000000,
  };

  if (config.env === 'production') {
    //@ts-ignore
    cookieOptions.sameSite = 'none';
  }

  /* 
      secure: true,
      httpOnly: true,
      // when my site is same url example: frontend ->sampodnath.com , backend ->sampodnath-api.com. then sameSite lagba na, when frontend ->sampodnath.com , but backend api.sampodnath.com then  sameSite: 'none',
      sameSite: 'none', // or remove this line for testing
      maxAge: 31536000000,
      maxAge: parseInt(config.jwt.refresh_expires_in || '31536000000'), 
  */
  //@ts-ignore
  res.cookie('refreshToken', refreshToken, cookieOptions);
  res.cookie('ref', 'refreshTokenUnited', cookieOptions);

  sendResponse<IRefreshTokenResponse>(req, res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully',
    data: result,
  });
});

const logOut = catchAsync(async (req: Request, res: Response) => {
  await AuthService.loginOutFromDb(req);

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Logout successfully',
  });
});
const enableTwoFactorAuth = catchAsync(async (req: Request, res: Response) => {
  const response = await AuthService.enableTwoFactorAuthFromDb(
    req.body,
    req.user as IUserRefAndDetails,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Logout successfully',
    data: response,
  });
});
const verifyTwoFactorAuth = catchAsync(async (req: Request, res: Response) => {
  const response = await AuthService.verifyTwoFactorAuthFromDb(
    req.body,
    req.user as IUserRefAndDetails,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Logout successfully',
    data: response,
  });
});
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { ...passwordData } = req.body;

  await AuthService.changePassword(user, passwordData, req);

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Password changed successfully',
  });
});

//----------- forget password ----------------

const forgotPass = catchAsync(async (req: Request, res: Response) => {
  await AuthService.forgotPass(req.body, req);

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Check your email!',
  });
});
const checkOtp = catchAsync(async (req: Request, res: Response) => {
  if (isNaN(req.body.otp)) {
    throw new ApiError(400, 'Invalid otp');
  }
  req.body.otp = Number(req.body.otp);

  const result = await AuthService.checkOtpFromDb(req.body, req);

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Successfully match your OTP',
    data: { token: result?.authentication?.jwtToken },
  });
});
const tokenToSetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.tokenToSetPasswordFromDb(req.body, req);

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Successfully change your password',
  });
});

//------------end----------------------------

const profile = catchAsync(async (req: Request, res: Response) => {
  const user = await User.isUserFindMethod(
    { id: req?.user?.userId },
    {
      isDelete: false,
      populate: true,
      needProperty: ['rating', 'insights'],
    },
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Successfully get your profile',
    data: user,
  });
});
const sendMailAuth = catchAsync(async (req: Request, res: Response) => {
  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'Successful!',
  });
});

export const AuthController = {
  loginUser,
  logOut,
  refreshToken,
  changePassword,
  //
  forgotPass,
  checkOtp,
  tokenToSetPassword,
  //

  profile,
  sendMailAuth,
  //
  enableTwoFactorAuth,
  verifyTwoFactorAuth,
};
