/* eslint-disable @typescript-eslint/no-unused-vars */
import bcrypt from 'bcrypt';
import { Request } from 'express';
import httpStatus from 'http-status';
import mongoose, { PipelineStage, Schema } from 'mongoose';
import { z } from 'zod';
import { ENUM_STATUS } from '../../../../global/enum_constant_type';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import { paginationHelper } from '../../../../helper/paginationHelper';
import ApiError from '../../../errors/ApiError';
import { IGenericResponse } from '../../../interface/common';
import { IPaginationOption } from '../../../interface/pagination';
import { Admin } from '../admin/admin.model';

import { LookupAnyRoleDetailsReusable } from '../../../../helper/lookUpResuable';

// import { ENUM_QUEUE_NAME } from '../../../queue/consent.queus';
// import { emailQueue } from '../../../queue/jobs/emailQueues';

import { sendMailHelper } from '../../../../utils/sendMail';
import { EmployeeUser } from '../employee/model.employee';
import { HrAdmin } from '../hrAdmin/model.hrAdmin';
import { userSearchableFields } from './user.constant';
import { ITempUser, IUser, IUserFilters } from './user.interface';
import { TempUser, User } from './user.model';
import { generateUserId } from './user.utils';
import { UserValidation } from './user.validation';
const createUser = async (
  data: any,
  req: Request,
): Promise<IUser | null | any> => {
  // auto generated incremental id
  const authData = data?.authData as z.infer<typeof UserValidation.authData> & {
    userUniqueId: string;
  };
  const roleData = data[authData?.role];
  // default password
  if (!authData?.password) {
    throw new ApiError(500, 'Please enter a password');
  }
  //---- verify user ---------------------------------------------
  const verifyTempUser = await TempUser.findById(
    authData?.tempUser?.tempUserId,
  );
  if (authData.role !== verifyTempUser?.role) {
    throw new ApiError(400, 'You are modifying data or not found temp user');
  }
  if (!verifyTempUser) {
    throw new ApiError(400, 'Failed to get request user');
  }
  if (verifyTempUser?.authentication?.otp !== Number(authData?.tempUser?.otp)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP not matching');
  }
  if (
    verifyTempUser?.authentication?.timeOut &&
    new Date(verifyTempUser?.authentication?.timeOut).getTime() < Date.now()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP has expired');
  }
  const session = await mongoose.startSession();
  let createdUser;
  let roleCreate;
  try {
    session.startTransaction();
    const id = await generateUserId();

    authData.userUniqueId =
      authData?.role?.toUpperCase()?.slice(0, 2) + '-' + id;

    createdUser = await User.create([{ ...authData }], { session });
    if (Array.isArray(createdUser) && !createdUser?.length) {
      throw new ApiError(400, 'Failed to create user');
    }
    if (authData?.role === ENUM_USER_ROLE.admin) {
      roleCreate = await Admin.create([{ ...roleData, ...authData }], {
        session,
      });
    } else if (authData?.role === ENUM_USER_ROLE.employee) {
      roleCreate = await EmployeeUser.create([{ ...roleData, ...authData }], {
        session,
      });
    } else if (authData?.role === ENUM_USER_ROLE.hrAdmin) {
      roleCreate = await HrAdmin.create([{ ...roleData, ...authData }], {
        session,
      });
    }

    if (Array.isArray(roleCreate) && !roleCreate.length) {
      throw new ApiError(400, 'Failed to create role user');
    }

    const deleteTemp = await TempUser.findByIdAndDelete(
      authData?.tempUser?.tempUserId,
      { session: session },
    );
    if (!deleteTemp) {
      throw new ApiError(400, 'Failed to delete temp user');
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new ApiError(error?.statusCode || 400, error?.message);
  }
  //----------------------------------------------------------------
  return createdUser.length ? createdUser[0] : null;
};

const createTempUserFromDb = async (
  user: ITempUser,
  req: Request,
): Promise<IUser | null> => {
  const previousUser = await User.findOne({ email: user.email?.toLowerCase() });
  if (previousUser?.isDelete) {
    throw new ApiError(
      400,
      'The account associated with this email is deleted. Please choose another email.',
    );
  } else if (previousUser?.email) {
    throw new ApiError(400, 'Email is already available');
  }

  // Calculate expiry time by adding 5 minutes to the current time
  const expiryTime = new Date(new Date().getTime() + 90 * 60000);
  const authData = {
    otp: Math.floor(100000 + Math.random() * 900000),
    timeOut: expiryTime,
  };
  const emailDate = {
    receiver_email: user.email,
    title: req.t('New account created'),
    subject: req.t('New account created'),
    body_text: ` <div style="text-align: center;">
    <h1 style=" padding: 10px 15px; background-color: #2ecc71; color: #fff; text-decoration: none; border-radius: 5px;">${authData.otp}</h1>
  </div>`,
    data: {
      otp: authData.otp,
      time_out: authData.timeOut,
    },
    footer_text: ` <div style="text-align: center;">
    <p>Expiry time: ${authData?.timeOut?.toLocaleTimeString()}</p>
  </div>`,
  };

  // const result = await sendMailHelper(emailDate);
  //
  // const job = await emailQueue.add(ENUM_QUEUE_NAME.email, emailDate);
  const job = await sendMailHelper(emailDate);
  console.log('🚀 ~ job:', job);
  //!--if you want to wait then job is completed then use it
  // const queueResult = await checkEmailQueueResult(job.id as string);
  const createdUser = await TempUser.create({
    ...user,
    authentication: authData,
    status: ENUM_STATUS.ACTIVE,
  });
  return createdUser;
};

const getAllUsersFromDB = async (
  filters: IUserFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<IUser[] | null>> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { searchTerm, needProperty, multipleRole, ...filtersData } = filters;

  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete == 'true'
      ? true
      : false
    : false;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      $or: userSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);
  const sortConditions: { [key: string]: 1 | -1 } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
  }

  //****************pagination end ***************/

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  const pipeline: PipelineStage[] = [
    { $match: whereConditions },
    { $sort: sortConditions },
    { $project: { password: 0 } },
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
    //line 5 in put lookup,
  ];
  if (needProperty?.toLowerCase()?.includes('roleinfo')) {
    LookupAnyRoleDetailsReusable(pipeline, {
      collections: [
        {
          roleMatchFiledName: 'role',
          idFiledName: '$email',
          pipeLineMatchField: '$email',
          outPutFieldName: 'roleInfo',
        },
      ],
      spliceStart: 5,
      spliceEnd: 0,
    });
    pipeline.push({ $sort: sortConditions });
  }

  const resultArray = [
    User.aggregate(pipeline),
    User.countDocuments(whereConditions),
  ];
  const result = await Promise.all(resultArray);

  // const result = await User.aggregate(pipeline);
  // const total = await User.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total: result[1] as number,
    },
    data: result[0] as IUser[],
  };
};

const updateUserFromDB = async (
  id: string,
  data: IUser,
  req: Request,
): Promise<IUser | null> => {
  const isExist = (await User.findById(id)) as IUser & {
    _id: Schema.Types.ObjectId;
  };
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    isExist?._id?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'Unauthorize user');
  }

  if (
    (data?.role === ENUM_USER_ROLE.superAdmin ||
      data?.role === ENUM_USER_ROLE.admin) &&
    isExist?._id?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(
      403,
      'Unauthorize user super admin data not update another user',
    );
  }

  let updatedUser;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    updatedUser = await User.findOneAndUpdate({ _id: id }, data, {
      new: true,
      runValidators: true,
      session,
    });
    if (data.status) {
      let roleUser;
      if (isExist.role === ENUM_USER_ROLE.employee) {
        roleUser = await EmployeeUser.findOneAndUpdate(
          { email: isExist.email },
          data,
          { runValidators: true, session },
        );
      } else if (isExist.role === ENUM_USER_ROLE.hrAdmin) {
        roleUser = await HrAdmin.findOneAndUpdate(
          { email: isExist.email },
          data,
          { runValidators: true, session },
        );
      } else if (isExist.role === ENUM_USER_ROLE.admin) {
        roleUser = await Admin.findOneAndUpdate(
          { email: isExist.email },
          data,
          { runValidators: true, session },
        );
      }
    }

    if (!updatedUser) {
      throw new ApiError(400, 'Failed to update user');
    }
    await session.commitTransaction();
    await session.endSession();
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error?.message || 'something went wrong',
    );
  }
  return updatedUser;
};

const getSingleUserFromDB = async (
  id: string,
  req: Request,
): Promise<IUser | null> => {
  const query = req?.query?.needProperty as string;
  const user = await User.isUserFindMethod(
    { id },
    {
      populate: true,
      needProperty: query?.split(',')?.map(property => property.trim()),
    },
  );

  return user;
};

const deleteUserFromDB = async (
  id: string,
  query: IUserFilters,
  req: Request,
): Promise<IUser | null> => {
  const isExist = (await User.findById(id).select('+password')) as IUser & {
    _id: Schema.Types.ObjectId;
  };

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    isExist?._id?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  //---- if user when delete you account then give his password
  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin
  ) {
    if (
      isExist.password &&
      !(await bcrypt.compare(req.body?.password, isExist.password))
    ) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Password is incorrect');
    }
  }

  let data;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    data = await User.findOneAndUpdate(
      { _id: id },
      { isDelete: true },
      { new: true, runValidators: true, session },
    );
    if (!data?._id) {
      throw new ApiError(400, 'Felid to delete user');
    }
    let roleUser;
    if (data?.role === ENUM_USER_ROLE.employee) {
      roleUser = await EmployeeUser.findOneAndUpdate(
        { email: data?.email },
        { isDelete: true },
        { runValidators: true, new: true },
      );
    } else if (data?.role === ENUM_USER_ROLE.hrAdmin) {
      roleUser = await HrAdmin.findOneAndUpdate(
        { email: data?.email },
        { isDelete: true },
        { runValidators: true, new: true },
      );
    } else if (
      req.user.role === ENUM_USER_ROLE.superAdmin &&
      data?.role === ENUM_USER_ROLE.admin
    ) {
      roleUser = await Admin.findOneAndUpdate(
        { email: data?.email },
        { isDelete: true },
        { runValidators: true, new: true },
      );
    }

    if (!roleUser) {
      throw new ApiError(400, 'Felid to delete user');
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new ApiError(error?.statusCode || 400, error?.message);
  }
  return data;
};

export const UserService = {
  createUser,
  getAllUsersFromDB,
  updateUserFromDB,
  getSingleUserFromDB,
  deleteUserFromDB,
  createTempUserFromDb,
};
