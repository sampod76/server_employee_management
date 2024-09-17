/* eslint-disable @typescript-eslint/no-unused-vars */
import bcrypt from 'bcrypt';
import { Request } from 'express';
import httpStatus from 'http-status';
import mongoose, { PipelineStage, Schema } from 'mongoose';
import { z } from 'zod';
import { ENUM_STATUS, ENUM_YN } from '../../../../global/enum_constant_type';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import { paginationHelper } from '../../../../helper/paginationHelper';
import ApiError from '../../../errors/ApiError';
import { IGenericResponse } from '../../../interface/common';
import { IPaginationOption } from '../../../interface/pagination';
import { Admin } from '../admin/admin.model';
import { BuyerUser } from '../buyer/model.buyer';

import { LookupAnyRoleDetailsReusable } from '../../../../helper/lookUpResuable';

import { ENUM_QUEUE_NAME } from '../../../queue/consent.queus';
import { emailQueue } from '../../../queue/jobs/emailQueues';
import { ENUM_ORDER_STATUS } from '../../order/constants.order';
import { Seller } from '../seller/model.seller';
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
    throw new ApiError(httpStatus.BAD_REQUEST, 'Otp not matching');
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
    if (authData?.role === ENUM_USER_ROLE.ADMIN) {
      roleCreate = await Admin.create([{ ...roleData, ...authData }], {
        session,
      });
    } else if (authData?.role === ENUM_USER_ROLE.BUYER) {
      roleCreate = await BuyerUser.create([{ ...roleData, ...authData }], {
        session,
      });
    } else if (authData?.role === ENUM_USER_ROLE.SELLER) {
      roleCreate = await Seller.create([{ ...roleData, ...authData }], {
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
  if (previousUser?.isDelete === ENUM_YN.YES) {
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

  //
  const job = await emailQueue.add(ENUM_QUEUE_NAME.email, emailDate);
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
    ? filtersData.isDelete
    : ENUM_YN.NO;

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
  if (needProperty?.includes('rating')) {
    const pipeLine: PipelineStage[] = [
      {
        $lookup: {
          from: 'reviews',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$buyer.userId', '$$id'] },
                    { $eq: ['$isDelete', ENUM_YN.NO] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                mainAverage: { $avg: '$overallRating' },
                totalRating: { $sum: '$overallRating' },
                totalReview: { $sum: 1 },
              },
            },
            {
              $addFields: {
                average: { $floor: '$mainAverage' },
                totalRating: { $floor: '$totalRating' },
              },
            },
          ],
          as: 'averageRatingDetails', // group to add 4 field automatically and manually addField me
          //output
          /* 
           {
             "_id": null,
             "mainAverage": 4.5,
             "totalRating": 4.5,
             "totalReview": 1,
             "average": 4,
             "total": 4
           }
          */
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $eq: [{ $size: '$averageRatingDetails' }, 0] },
              then: [{ average: 0, total: 0, totalReview: 0 }],
              else: '$averageRatingDetails',
            },
          },
        },
      },
      { $unwind: '$averageRating' },
      { $project: { averageRatingDetails: 0 } },
    ];
    pipeline.push(...pipeLine);
  }
  if (needProperty?.includes('insights')) {
    const pipeLine: PipelineStage[] = [
      //buyerProfileToTotal
      {
        $lookup: {
          from: 'orders',
          let: { id: '$_id' },
          pipeline: [
            //first of all your all review by buyer Profile
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$buyer.userId', '$$id'] },
                    // {
                    //   $or: [
                    //     { $eq: ['$buyer.userId', '$$id'] },
                    //     { $eq: ['$seller.userId', '$$id'] },
                    //   ],
                    // },
                    { $eq: ['$isDelete', ENUM_YN.NO] },
                  ],
                },
              },
            },
            //then parallel call matching all order statements -> complete,accepted
            {
              $facet: {
                completed: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ['$orderStatus', ENUM_ORDER_STATUS.completed],
                          },
                          { $eq: ['$isDelete', ENUM_YN.NO] },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      count: { $sum: 1 },
                    },
                  },
                ],
                accepted: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$orderStatus', ENUM_ORDER_STATUS.accept] },
                          { $eq: ['$isDelete', ENUM_YN.NO] },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      count: { $sum: 1 },
                    },
                  },
                ],
              },
            },
          ],
          as: 'buyerProfileToTotal',
          /* //? output
             "buyerProfileToTotal":  [{
                "completed": [
                     {
                         "_id": null,
                         "count": 1
                     }
                  ],
                "accepted": [
                      {
                          "_id": null,
                          "count": 5
                      }
                  ]
        }],
          */
        },
      },
      {
        $unwind: '$buyerProfileToTotal',
      },
      {
        $addFields: {
          buyerProfileToTotal: {
            completed: {
              $cond: {
                if: {
                  $eq: [{ $size: '$buyerProfileToTotal.completed.count' }, 0],
                },
                then: 0,
                else: {
                  $arrayElemAt: ['$buyerProfileToTotal.completed.count', 0],
                },
              },
            },
            accepted: {
              $cond: {
                if: {
                  $eq: [{ $size: '$buyerProfileToTotal.accepted.count' }, 0],
                },
                then: 0,
                else: {
                  $arrayElemAt: ['$buyerProfileToTotal.accepted.count', 0],
                },
              },
            },
          },
        },
      },
      /* //!-- output---modified
       "buyerProfileToTotal": {
          "completed": 1,
          "accepted": 0
          },
      
      */

      //sellerProfileToTotal
      {
        $lookup: {
          from: 'orders',
          let: { id: '$_id' },
          pipeline: [
            //first of all your all review by buyer Profile
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$seller.userId', '$$id'] },
                    { $eq: ['$isDelete', ENUM_YN.NO] },
                  ],
                },
              },
            },
            //then parallel call matching all order statements -> complete,accepted
            {
              $facet: {
                completed: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ['$orderStatus', ENUM_ORDER_STATUS.completed],
                          },
                          { $eq: ['$isDelete', ENUM_YN.NO] },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      count: { $sum: 1 },
                    },
                  },
                ],
                accepted: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$orderStatus', ENUM_ORDER_STATUS.accept] },
                          { $eq: ['$isDelete', ENUM_YN.NO] },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      count: { $sum: 1 },
                    },
                  },
                ],
              },
            },
          ],
          as: 'sellerProfileToTotal',
          /* //? output
             "sellerProfileToTotal":  [{
                "completed": [
                     {
                         "_id": null,
                         "count": 1
                     }
                  ],
                "accepted": [
                      {
                          "_id": null,
                          "count": 5
                      }
                  ]
        }],
          */
        },
      },
      {
        $unwind: '$sellerProfileToTotal',
      },
      //--optional --> only modify respond by readable
      {
        $addFields: {
          // optional
          sellerProfileToTotal: {
            completed: {
              $cond: {
                if: {
                  $eq: [{ $size: '$sellerProfileToTotal.completed.count' }, 0],
                },
                then: 0,
                else: {
                  $arrayElemAt: ['$sellerProfileToTotal.completed.count', 0],
                },
              },
            },
            accepted: {
              $cond: {
                if: {
                  $eq: [{ $size: '$sellerProfileToTotal.accepted.count' }, 0],
                },
                then: 0,
                else: {
                  $arrayElemAt: ['$sellerProfileToTotal.accepted.count', 0],
                },
              },
            },
          },
        },
      },
      /* //!-- output---modified
       "sellerProfileToTotal": {
          "completed": 1,
          "accepted": 0
          },
      
      */

      //
    ];
    pipeline.push(...pipeLine);
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
    req?.user?.role !== ENUM_USER_ROLE.ADMIN &&
    req?.user?.role !== ENUM_USER_ROLE.SUPER_ADMIN &&
    isExist?._id?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'Unauthorize user');
  }

  if (
    (data?.role === ENUM_USER_ROLE.SUPER_ADMIN ||
      data?.role === ENUM_USER_ROLE.ADMIN) &&
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
      if (isExist.role === ENUM_USER_ROLE.BUYER) {
        roleUser = await BuyerUser.findOneAndUpdate(
          { email: isExist.email },
          data,
          { runValidators: true, session },
        );
      } else if (isExist.role === ENUM_USER_ROLE.SELLER) {
        roleUser = await Seller.findOneAndUpdate(
          { email: isExist.email },
          data,
          { runValidators: true, session },
        );
      } else if (isExist.role === ENUM_USER_ROLE.ADMIN) {
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

  if (!user) {
    throw new ApiError(400, 'Failed to get user');
  }
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
    req?.user?.role !== ENUM_USER_ROLE.ADMIN &&
    req?.user?.role !== ENUM_USER_ROLE.SUPER_ADMIN &&
    isExist?._id?.toString() !== req?.user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  //---- if user when delete you account then give his password
  if (
    req?.user?.role !== ENUM_USER_ROLE.ADMIN &&
    req?.user?.role !== ENUM_USER_ROLE.SUPER_ADMIN
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
      { isDelete: ENUM_YN.YES },
      { new: true, runValidators: true, session },
    );
    if (!data?._id) {
      throw new ApiError(400, 'Felid to delete user');
    }
    let roleUser;
    if (data?.role === ENUM_USER_ROLE.BUYER) {
      roleUser = await BuyerUser.findOneAndUpdate(
        { email: data?.email },
        { isDelete: ENUM_YN.YES },
        { runValidators: true, new: true },
      );
    } else if (data?.role === ENUM_USER_ROLE.SELLER) {
      roleUser = await Seller.findOneAndUpdate(
        { email: data?.email },
        { isDelete: ENUM_YN.YES },
        { runValidators: true, new: true },
      );
    } else if (
      req.user.role === ENUM_USER_ROLE.SUPER_ADMIN &&
      data?.role === ENUM_USER_ROLE.ADMIN
    ) {
      roleUser = await Admin.findOneAndUpdate(
        { email: data?.email },
        { isDelete: ENUM_YN.YES },
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
