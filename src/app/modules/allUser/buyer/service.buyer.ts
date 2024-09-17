/* eslint-disable @typescript-eslint/no-unused-vars */
import bcrypt from 'bcrypt';
import { Request } from 'express';
import httpStatus from 'http-status';
import mongoose, { PipelineStage, Schema, Types } from 'mongoose';

import { ENUM_YN } from '../../../../global/enum_constant_type';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import { paginationHelper } from '../../../../helper/paginationHelper';
import ApiError from '../../../errors/ApiError';
import { IGenericResponse } from '../../../interface/common';
import { IPaginationOption } from '../../../interface/pagination';

import { LookupReusable } from '../../../../helper/lookUpResuable';
import { ENUM_VERIFY } from '../typesAndConst';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { buyerSearchableFields } from './constant.buyer';
import { IBuyerUser, IBuyerUserFilters } from './interface.buyer';
import { BuyerUser } from './model.buyer';

const createBuyerUser = async (
  data: IBuyerUser,
  req?: Request,
): Promise<IBuyerUser | null> => {
  const res = await BuyerUser.create(data);
  return res;
};

const getAllBuyerUsersFromDB = async (
  filters: IBuyerUserFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<IBuyerUser[] | null>> => {
  const { searchTerm, needProperty, ...filtersData } = filters;
  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete
    : ENUM_YN.NO;
  filtersData.verify = filtersData.verify
    ? filtersData.verify
    : ENUM_VERIFY.ACCEPT;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      $or: buyerSearchableFields.map((field: string) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => {
        let modifyFiled;
        /* 
        if (field === 'userRoleBaseId' || field === 'referRoleBaseId') {
          modifyFiled = { [field]: new Types.ObjectId(value) };
        } else {
          modifyFiled = { [field]: value };
        } 
        */
        if (field === 'authorRoleBaseId') {
          modifyFiled = {
            ['author.roleBaseUserId']: new Types.ObjectId(value),
          };
        } else {
          modifyFiled = { [field]: value };
        }
        return modifyFiled;
      }),
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
  ];
  LookupReusable(pipeline, {
    collections: [
      {
        connectionName: 'users',
        idFiledName: 'email',
        pipeLineMatchField: 'email',
        outPutFieldName: 'userDetails',
      },
    ],
  });

  // const result = await BuyerUser.aggregate(pipeline);
  // const total = await BuyerUser.countDocuments(whereConditions);
  //!-- alternatively and faster
  const pipeLineResult = await BuyerUser.aggregate([
    {
      $facet: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        data: pipeline,
        countDocuments: [
          {
            $match: whereConditions,
          },
          { $count: 'totalData' },
        ],
      },
    },
  ]);
  // Extract and format the pipeLineResults
  const total = pipeLineResult[0]?.countDocuments[0]?.totalData || 0; // Extract total count
  const result = pipeLineResult[0]?.data || []; // Extract data
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const updateBuyerUserFromDB = async (
  id: string,
  data: IBuyerUser,
  req: Request,
): Promise<IBuyerUser | null> => {
  const isExist = (await BuyerUser.findById(id)) as IBuyerUser & {
    _id: Schema.Types.ObjectId;
  };
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'BuyerUser not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?._id?.toString() !== req?.user?.roleBaseUserId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { name, address, ...BuyerUserData } = data;
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin
  ) {
    delete (BuyerUserData as Partial<IBuyerUser>)['isDelete']; // remove it because , any user update time to not update this field , when user apply delete route to modify this field
    delete (BuyerUserData as Partial<IBuyerUser>)['email'];
    delete (BuyerUserData as Partial<IBuyerUser>)['userUniqueId'];
    delete (BuyerUserData as Partial<IBuyerUser>)['verify'];
  }
  const updatedBuyerUserData: Partial<IBuyerUser> = { ...BuyerUserData };

  if (address && Object.keys(address).length) {
    Object.keys(address).forEach(key => {
      const nameKey = `address.${key}` as keyof Partial<IBuyerUser>;
      (updatedBuyerUserData as any)[nameKey] =
        address[key as keyof typeof address];
    });
  }
  if (name && Object.keys(name).length) {
    Object.keys(name).forEach(key => {
      const nameKey = `name.${key}` as keyof Partial<IBuyerUser>;
      (updatedBuyerUserData as any)[nameKey] = name[key as keyof typeof name];
    });
  }
  const updatedBuyerUser = await BuyerUser.findOneAndUpdate(
    { _id: id },
    updatedBuyerUserData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedBuyerUser) {
    throw new ApiError(400, 'Failed to update BuyerUser');
  }
  return updatedBuyerUser;
};

const getSingleBuyerUserFromDB = async (
  id: string,
  req: Request,
): Promise<IBuyerUser | null> => {
  const user = await BuyerUser.isBuyerUserExistMethod(id, {
    populate: true,
  });

  return user;
};

const deleteBuyerUserFromDB = async (
  id: string,
  query: IBuyerUserFilters,
  req: Request,
): Promise<IBuyerUser | null> => {
  // const isExist = (await BuyerUser.findById(id).select('+password')) as IBuyerUser & {
  //   _id: Schema.Types.ObjectId;
  // };
  const isExist = await BuyerUser.aggregate([
    { $match: { _id: new Types.ObjectId(id), isDelete: ENUM_YN.NO } },
  ]);

  if (!isExist.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'BuyerUser not found');
  }

  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    isExist[0]?._id?.toString() !== req?.user?.roleBaseUserId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  //---- if user when delete you account then give his password
  if (
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    req?.user?.role !== ENUM_USER_ROLE.superAdmin
  ) {
    if (
      isExist[0].password &&
      !(await bcrypt.compare(req.body?.password, isExist[0].password))
    ) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Password is incorrect');
    }
  }

  let data;

  if (
    query.delete == ENUM_YN.YES && // this is permanently delete but store trash collection
    (req?.user?.role == ENUM_USER_ROLE.admin ||
      req?.user?.role == ENUM_USER_ROLE.superAdmin)
  ) {
    // data = await BuyerUser.findOneAndDelete({ _id: id });
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      data = await BuyerUser.findOneAndDelete({ _id: id });
      // console.log('🚀 ~ data:', data);
      if (!data?.email) {
        throw new ApiError(400, 'Felid to delete BuyerUser');
      }
      const deleteUser = (await User.findOneAndDelete({
        email: isExist[0].email,
      })) as IUser;
      if (!deleteUser?.email) {
        throw new ApiError(400, 'Felid to delete BuyerUser');
      }
      await session.commitTransaction();
      await session.endSession();
    } catch (error: any) {
      await session.abortTransaction();
      await session.endSession();
      throw new ApiError(error?.statusCode || 400, error?.message);
    }
  } else {
    // data = await BuyerUser.findOneAndUpdate(
    //   { _id: id },
    //   { isDelete: ENUM_YN.YES },
    //   { new: true, runValidators: true },
    // );

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      data = await BuyerUser.findOneAndUpdate(
        { _id: id },
        { isDelete: ENUM_YN.YES },
        { new: true, runValidators: true, session },
      );
      // console.log('🚀 ~ data:', data);
      if (!data?.email) {
        throw new ApiError(400, 'Felid to delete BuyerUser');
      }
      const deleteUser = await User.findOneAndUpdate(
        { email: isExist[0].email },
        { isDelete: ENUM_YN.YES },
        { new: true, runValidators: true, session },
      );
      if (!deleteUser?.email) {
        throw new ApiError(400, 'Felid to delete BuyerUser');
      }
      await session.commitTransaction();
      await session.endSession();
    } catch (error: any) {
      await session.abortTransaction();
      await session.endSession();
      throw new ApiError(error?.statusCode || 400, error?.message);
    }
  }
  return data;
};

export const BuyerUserService = {
  createBuyerUser,
  getAllBuyerUsersFromDB,
  updateBuyerUserFromDB,
  getSingleBuyerUserFromDB,
  deleteBuyerUserFromDB,
};
