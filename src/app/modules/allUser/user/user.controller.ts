/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';

import httpStatus from 'http-status';
import { z } from 'zod';
import config from '../../../../config';
import { PAGINATION_FIELDS } from '../../../../global/constant/pagination';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import { jwtHelpers } from '../../../../helper/jwtHelpers';
import ApiError from '../../../errors/ApiError';
import { findAllSocketsIdsFromUserId } from '../../../redis/service.redis';
import catchAsync from '../../../share/catchAsync';
import pick from '../../../share/pick';
import sendResponse from '../../../share/sendResponse';
import { userFilterableFields } from './user.constant';
import { IUser } from './user.interface';
import { UserService } from './user.service';
import { UserValidation } from './user.validation';

const createUser = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  const authData = req.body?.authData as z.infer<
    typeof UserValidation.authData
  >;

  //! ------ validate admin or super admin -----if create admin or supper admin create then must be send token
  const user = req?.user;
  if (authData.role === ENUM_USER_ROLE.admin) {
    if (!user) {
      throw new ApiError(403, 'forbidden access');
    }

    if (
      authData.role === ENUM_USER_ROLE.admin &&
      user?.role !== ENUM_USER_ROLE.superAdmin
    ) {
      throw new ApiError(403, 'forbidden access');
    }

    req.body[authData.role]['author'] = {
      userId: user?.userId,
      role: user?.role,
      roleBaseUserId: user?.roleBaseUserId,
    };
  }

  if (req?.body?.profileImage) {
    req.body = {
      ...req.body,
      [authData.role]: {
        ...req.body[authData.role],
        profileImage: req.body.profileImage,
      },
    };
  }

  //------------------------------------------
  const result = await UserService.createUser(req.body, req);
  sendResponse<IUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User created successfully',
    data: result,
  });
});
const createUserTempUser = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  let user;
  //! ------ validate admin or super admin -----if create admin or supper admin create then must be send token
  if (data.role === ENUM_USER_ROLE.admin) {
    try {
      user =
        req.headers.authorization &&
        jwtHelpers.verifyToken(
          req.headers.authorization,
          config.jwt.secret as string,
        );
    } catch (error) {
      throw new ApiError(403, 'Unauthorized');
    }
    if (!user) {
      throw new ApiError(403, 'Unauthorized');
    } else if (
      user?.role !== ENUM_USER_ROLE.admin &&
      user?.role !== ENUM_USER_ROLE.superAdmin
    ) {
      throw new ApiError(403, 'Unauthorized');
    }
  }
  //------------------------------------------
  const result = await UserService.createTempUserFromDb(data, req);
  sendResponse<any>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User created successfully',
    //@ts-ignore
    data: { _id: result?._id },
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);
  const result = await UserService.getAllUsersFromDB(
    filters,
    paginationOptions,
    req,
  );

  sendResponse<IUser[]>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Get all users',
    data: result.data,
    meta: result.meta,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  //  await RequestToFileDecodeAddBodyHandle(req);
  const { password, role, authentication, ...data } = req.body;
  const id = req.params.id;

  const result = await UserService.updateUserFromDB(id, data, req);
  sendResponse<IUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await UserService.getSingleUserFromDB(id, req);
  sendResponse<IUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User find successfully',
    data: result,
  });
});
const isOnline = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userid;
  const result = await findAllSocketsIdsFromUserId(userId);
  sendResponse<any>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User find successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await UserService.deleteUserFromDB(id, req.query, req);

  sendResponse<IUser>(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  updateUser,
  getSingleUser,
  deleteUser,
  createUserTempUser,
  isOnline,
};
