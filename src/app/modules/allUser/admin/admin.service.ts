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
import { User } from '../user/user.model';
import { adminSearchableFields } from './admin.constant';
import { IAdmin, IAdminFilters } from './admin.interface';
import { Admin } from './admin.model';

const createAdmin = async (
  data: IAdmin,
  req?: Request,
): Promise<IAdmin | null> => {
  const res = await Admin.create(data);
  return res;
};

const getAllAdminsFromDB = async (
  filters: IAdminFilters,
  paginationOptions: IPaginationOption,
  req: Request,
): Promise<IGenericResponse<IAdmin[] | null>> => {
  const { searchTerm, ...filtersData } = filters;
  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete
    : ENUM_YN.NO;
  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      $or: adminSearchableFields.map((field: string) => ({
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
    {
      $lookup: {
        from: 'users',
        let: { email: '$email' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$email', '$$email'] },
              // Additional filter conditions for collection2
            },
          },
          { $project: { password: 0 } },
          // Additional stages for collection2
        ],
        as: 'userDetails',
      },
    },

    //মনে রাখতে হবে যদি এটি দেওয়া না হয় তাহলে সে যখন কোন একটি ক্যাটাগরির থাম্বেল না পাবে সে তাকে দেবে না
    {
      $addFields: {
        roleInfo: {
          $cond: {
            if: { $eq: [{ $size: '$userDetails' }, 0] },
            then: [{}],
            else: '$userDetails',
          },
        },
      },
    },
    {
      $project: { userDetails: 0 },
    },
    {
      $unwind: '$roleInfo',
    },
  ];
  // const result = await Admin.aggregate(pipeline);
  // const total = await Admin.countDocuments(whereConditions);
  //!-- alternatively and faster
  const pipeLineResult = await Admin.aggregate([
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

const updateAdminFromDB = async (
  id: string,
  data: IAdmin,
  req: Request,
): Promise<IAdmin | null> => {
  const isExist = (await Admin.findById(id)) as IAdmin & {
    _id: Schema.Types.ObjectId;
  };
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin &&
    isExist?._id?.toString() !== req?.user?.roleBaseUserId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { address, ...AdminData } = data;
  if (
    req?.user?.role !== ENUM_USER_ROLE.superAdmin &&
    req?.user?.role !== ENUM_USER_ROLE.admin
  ) {
    delete (AdminData as Partial<IAdmin>)['isDelete']; // remove it because , any user update time to not update this field , when user apply delete route to modify this field
    delete (AdminData as Partial<IAdmin>)['email'];
    delete (AdminData as Partial<IAdmin>)['userUniqueId'];
  }
  const updatedAdminData: Partial<IAdmin> = { ...AdminData };

  if (address && Object.keys(address).length > 0) {
    Object.keys(address).forEach(key => {
      const nameKey = `address.${key}` as keyof Partial<IAdmin>;
      (updatedAdminData as any)[nameKey] = address[key as keyof typeof address];
    });
  }
  const updatedAdmin = await Admin.findOneAndUpdate(
    { _id: id },
    updatedAdminData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedAdmin) {
    throw new ApiError(400, 'Failed to update Admin');
  }
  return updatedAdmin;
};

const getSingleAdminFromDB = async (
  id: string,
  req: Request,
): Promise<IAdmin | null> => {
  const pipeline: PipelineStage[] = [
    { $match: { _id: new Types.ObjectId(id) } },
    {
      $lookup: {
        from: 'users',
        let: { email: '$email' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$email', '$$email'] },
              // Additional filter conditions for collection2
            },
          },
          { $project: { password: 0 } },
          // Additional stages for collection2
        ],
        as: 'userDetails',
      },
    },
    //মনে রাখতে হবে যদি এটি দেওয়া না হয় তাহলে সে যখন কোন একটি ক্যাটাগরির থাম্বেল না পাবে সে তাকে দেবে না
    {
      $addFields: {
        roleInfo: {
          $cond: {
            if: { $eq: [{ $size: '$userDetails' }, 0] },
            then: [{}],
            else: '$userDetails',
          },
        },
      },
    },
    {
      $project: { userDetails: 0 },
    },
    {
      $unwind: '$roleInfo',
    },
  ];
  const user = await Admin.aggregate(pipeline);

  if (!user[0]) {
    throw new ApiError(400, 'Failed to get Admin');
  }
  return user[0];
};

const deleteAdminFromDB = async (
  id: string,
  query: IAdminFilters,
  req: Request,
): Promise<IAdmin | null> => {
  // const isExist = (await Admin.findById(id).select('+password')) as IAdmin & {
  //   _id: Schema.Types.ObjectId;
  // };
  const isExist = await Admin.aggregate([
    { $match: { _id: new Types.ObjectId(id), isDelete: ENUM_YN.NO } },
  ]);

  if (!isExist.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
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
    data = await Admin.findOneAndDelete({ _id: id });
  } else {
    // data = await Admin.findOneAndUpdate(
    //   { _id: id },
    //   { isDelete: ENUM_YN.YES },
    //   { new: true, runValidators: true },
    // );

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      data = await Admin.findOneAndUpdate(
        { _id: id },
        { isDelete: ENUM_YN.YES },
        { new: true, runValidators: true, session },
      );
      // console.log('🚀 ~ data:', data);
      if (!data?.email) {
        throw new ApiError(400, 'Felid to delete Admin');
      }
      const deleteUser = await User.findOneAndUpdate(
        { email: isExist[0].email },
        { isDelete: ENUM_YN.YES },
        { new: true, runValidators: true, session },
      );
      if (!deleteUser?.email) {
        throw new ApiError(400, 'Felid to delete Admin');
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

export const AdminService = {
  createAdmin,
  getAllAdminsFromDB,
  updateAdminFromDB,
  getSingleAdminFromDB,
  deleteAdminFromDB,
};
