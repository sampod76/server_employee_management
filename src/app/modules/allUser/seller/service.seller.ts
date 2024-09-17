/* eslint-disable @typescript-eslint/ban-ts-comment */
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
import { ENUM_VERIFY, IUserRef } from '../typesAndConst';
import { User } from '../user/user.model';
import { sellerSearchableFields } from './constant.seller';
import { ISellerUser, ISellerUserFilters } from './interface.seller';
import { Seller } from './model.seller';

const createSeller = async (
  data: ISellerUser,
  req?: Request,
): Promise<ISellerUser | null> => {
  const res = await Seller.create(data);
  return res;
};

const getAllSellersFromDB = async (
  filters: ISellerUserFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<ISellerUser[] | null>> => {
  const {
    searchTerm,
    createdAtFrom,
    createdAtTo,

    needProperty,
    ...filtersData
  } = filters;
  filtersData.isDelete = filtersData.isDelete || false;
  filtersData.verify = filtersData.verify
    ? filtersData.verify
    : ENUM_VERIFY.ACCEPT;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      $or: sellerSearchableFields.map((field: string) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filtersData).length) {
    const condition = Object.entries(filtersData).map(
      //@ts-ignore
      ([field, value]: [keyof typeof filtersData, string]) => {
        let modifyFiled;
        /* 
        if (field === 'userRoleBaseId' || field === 'referRoleBaseId') {
        modifyFiled = { [field]: new Types.ObjectId(value) };
        } else {
         modifyFiled = { [field]: value };
         } 
       */
        if (field === 'countryName') {
          modifyFiled = {
            ['country.name']: new Types.ObjectId(value),
          };
        } else if (field === 'skills') {
          modifyFiled = {
            [field]: { $in: [...value.split(',')] },
          };
        } else if (field === 'dateOfBirth') {
          const timeTo = new Date(value);
          const createdAtToModify = new Date(timeTo.setHours(23, 59, 59, 999));
          modifyFiled = {
            [field]: {
              $gte: new Date(value),
              $lte: new Date(createdAtToModify),
            },
          };
        }
        //  else if (field === 'from') {
        //   modifyFiled = {
        //     ['from']: { $gte: new Date(value) },
        //   };
        // } else if (field === 'to') {
        //   modifyFiled = {
        //     ['to']: { $lte: new Date(value) },
        //   };
        // }
        else {
          modifyFiled = { [field]: value };
        }
        // console.log(modifyFiled);
        return modifyFiled;
      },
    );
    //
    if (createdAtFrom && !createdAtTo) {
      //only single data in register all data -> 2022-02-25_12:00 am to 2022-02-25_11:59 pm minutes
      const timeTo = new Date(createdAtFrom);
      const createdAtToModify = new Date(timeTo.setHours(23, 59, 59, 999));
      condition.push({
        //@ts-ignore
        createdAt: {
          $gte: new Date(createdAtFrom),
          $lte: new Date(createdAtToModify),
        },
      });
    } else if (createdAtFrom && createdAtTo) {
      condition.push({
        //@ts-ignore
        createdAt: {
          $gte: new Date(createdAtFrom),
          $lte: new Date(createdAtTo),
        },
      });
    }

    //
    andConditions.push({
      $and: condition,
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

  // const result = await Seller.aggregate(pipeline);
  // const total = await Seller.countDocuments(whereConditions);
  //!-- alternatively and faster
  const pipeLineResult = await Seller.aggregate([
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

const updateSellerFromDB = async (
  id: string,
  data: ISellerUser,
  user?: IUserRef,
  req?: Request,
): Promise<ISellerUser | null> => {
  const isExist = (await Seller.findById(id)) as ISellerUser & {
    _id: Schema.Types.ObjectId;
  };
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Seller not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?._id?.toString() !== req?.user?.roleBaseUserId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { name, address, ...SellerData } = data;
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin
  ) {
    delete (SellerData as Partial<ISellerUser>)['isDelete']; // remove it because , any user update time to not update this field , when user apply delete route to modify this field
    delete (SellerData as Partial<ISellerUser>)['email'];
    delete (SellerData as Partial<ISellerUser>)['userUniqueId'];
    delete (SellerData as Partial<ISellerUser>)['verify'];
  }
  const updatedSellerData: Partial<ISellerUser> = { ...SellerData };

  if (address && Object.keys(address).length) {
    Object.keys(address).forEach(key => {
      const nameKey = `address.${key}` as keyof Partial<ISellerUser>;
      (updatedSellerData as any)[nameKey] =
        address[key as keyof typeof address];
    });
  }
  if (name && Object.keys(name).length) {
    Object.keys(name).forEach(key => {
      const nameKey = `name.${key}` as keyof Partial<ISellerUser>;
      (updatedSellerData as any)[nameKey] = name[key as keyof typeof name];
    });
  }
  const updatedSeller = await Seller.findOneAndUpdate(
    { _id: id },
    updatedSellerData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedSeller) {
    throw new ApiError(400, 'Failed to update Seller');
  }
  return updatedSeller;
};

const getSingleSellerFromDB = async (
  id: string,
  req: Request,
): Promise<ISellerUser | null> => {
  const user = await Seller.isSellerUserExistMethod(id, {
    populate: true,
  });

  return user;
};

const deleteSellerFromDB = async (
  id: string,
  query: ISellerUserFilters,
  req: Request,
): Promise<ISellerUser | null> => {
  // const isExist = (await Seller.findById(id).select('+password')) as ISellerUser & {
  //   _id: Schema.Types.ObjectId;
  // };
  const isExist = await Seller.aggregate([
    { $match: { _id: new Types.ObjectId(id), isDelete: ENUM_YN.NO } },
  ]);

  if (!isExist.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Seller not found');
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
    data = null;
    // data = await Seller.findOneAndDelete({ _id: id });
    /*  const session = await mongoose.startSession();
    try {
      session.startTransaction();
      data = await Seller.findOneAndDelete({ _id: id });
      if (!data?.email) {
        throw new ApiError(400, 'Felid to delete Seller');
      }
      const deleteUser = (await User.findOneAndDelete({
        email: isExist[0].email,
      })) as IUser;
      if (!deleteUser?.email) {
        throw new ApiError(400, 'Felid to delete Seller');
      }
      await session.commitTransaction();
      await session.endSession();
    } catch (error: any) {
      await session.abortTransaction();
      await session.endSession();
      throw new ApiError(error?.statusCode || 400, error?.message);
    } */
  } else {
    // data = await Seller.findOneAndUpdate(
    //   { _id: id },
    //   { isDelete: true },
    //   { new: true, runValidators: true },
    // );

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      data = await Seller.findOneAndUpdate(
        { _id: id },
        { isDelete: true },
        { new: true, runValidators: true, session },
      );
      if (!data?.email) {
        throw new ApiError(400, 'Felid to delete Seller');
      }
      const deleteUser = await User.findOneAndUpdate(
        { email: isExist[0].email },
        { isDelete: true },
        { new: true, runValidators: true, session },
      );
      if (!deleteUser?.email) {
        throw new ApiError(400, 'Felid to delete Seller');
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

export const SellerService = {
  createSeller,
  getAllSellersFromDB,
  updateSellerFromDB,
  getSingleSellerFromDB,
  deleteSellerFromDB,
};
