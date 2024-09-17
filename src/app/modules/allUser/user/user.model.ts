/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-this-alias */
import bcrypt from 'bcrypt';
import { PipelineStage, Schema, Types, model } from 'mongoose';
import config from '../../../../config';

import {
  ENUM_SOCKET_STATUS,
  ENUM_STATUS,
  ENUM_YN,
  I_YN,
  SOCKET_STATUS_ARRAY,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../../global/enum_constant_type';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import { mongooseLocationSchema } from '../../../../global/schema/global.schema';
import ApiError from '../../../errors/ApiError';
import { Admin } from '../admin/admin.model';
import { BuyerUser } from '../buyer/model.buyer';

import { LookupAnyRoleDetailsReusable } from '../../../../helper/lookUpResuable';

import { ENUM_REDIS_KEY } from '../../../redis/consent.redis';
import { redisClient } from '../../../redis/redis';
import { ENUM_ORDER_STATUS } from '../../order/constants.order';
import { Seller } from '../seller/model.seller';
import { mongooseIUserRef } from '../typesAndConst';
import { IUser, USER_ROLE_ARRAY, UserModel } from './user.interface';

const userSchema = new Schema<IUser, UserModel>(
  {
    userUniqueId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      // required: true,
    },
    buyer: mongooseIUserRef,
    seller: mongooseIUserRef,
    email: {
      type: String,
      required: true,
      lowercase: true,
      // unique: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: USER_ROLE_ARRAY,
      default: ENUM_USER_ROLE.BUYER,
    },
    password: {
      type: String,
      required: true,
      select: 0,
    },
    //
    //
    authentication: {
      otp: Number,
      timeOut: Date,
      jwtToken: String,
      status: {
        type: String,
        enum: STATUS_ARRAY,
        // default: ENUM_STATUS.ACTIVE,
      },
    },
    lastActive: {
      createdAt: Date,
    },
    secret: String,
    socketStatus: {
      type: String,
      enum: SOCKET_STATUS_ARRAY,
      default: ENUM_SOCKET_STATUS.OFFLINE,
    },
    location: mongooseLocationSchema,
    status: {
      type: String,
      enum: STATUS_ARRAY,
      default: ENUM_STATUS.ACTIVE,
    },
    isDelete: {
      type: String,
      enum: YN_ARRAY,
      default: ENUM_YN.NO,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

userSchema.statics.isUserFindMethod = async function (
  query: { id?: string; email?: string },
  option?: {
    isDelete?: I_YN;
    populate?: boolean;
    password?: boolean;
    needProperty?: string[];
  },
): Promise<IUser | null> {
  let user;
  const match: any = {};
  if (query.id) {
    match._id = new Types.ObjectId(query.id);
  } else if (query.email) {
    match.email = query.email;
  }
  if (option?.isDelete) {
    match.isDelete = option.isDelete;
  } else {
    match.isDelete = ENUM_YN.NO;
  }
  const project: any = { __v: 0, password: 0 };
  if (option?.password) {
    delete project.password;
  }
  if (!option?.populate) {
    const result = await User.aggregate([
      {
        $match: match,
      },
      {
        $project: project,
      },
    ]);
    user = result[0];
  } else {
    const pipeline: PipelineStage[] = [
      {
        $match: match,
      },
      {
        $project: project,
      },
    ];
    LookupAnyRoleDetailsReusable(pipeline, {
      collections: [
        {
          roleMatchFiledName: 'role',
          idFiledName: '$email',
          pipeLineMatchField: '$email',
          outPutFieldName: 'roleInfo',
        },
      ],
    });
    if (option?.needProperty?.includes('rating')) {
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
    if (option?.needProperty?.includes('insights')) {
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
                              $eq: [
                                '$orderStatus',
                                ENUM_ORDER_STATUS.completed,
                              ],
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
                              $eq: [
                                '$orderStatus',
                                ENUM_ORDER_STATUS.completed,
                              ],
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
                    $eq: [
                      { $size: '$sellerProfileToTotal.completed.count' },
                      0,
                    ],
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
    //!---Any role add then this role Must be add allGetUsers in --
    const result = (await User.aggregate(pipeline)) as IUser[];

    user = result[0];
  }
  return user;
};
userSchema.statics.isPasswordMatchMethod = async function (
  givenPassword: string,
  savedPassword: string,
): Promise<boolean | null> {
  return await bcrypt.compare(givenPassword, savedPassword);
};
// before save then data then call this hook
userSchema.pre('save', async function (next) {
  try {
    const user = this;
    /*
     const UserModel = this.constructor as UserModel; // Explicit cast
    !--- another application in work this condition--but when same email to create multiple types account then not work this
    const existingUser = await UserModel.findOne({ email: user.email });
     if (existingUser?.email) {
     throw new ApiError(400, 'Email is already available');
    }
      */
    let roleUser;
    if (user.role === ENUM_USER_ROLE.BUYER) {
      roleUser = await BuyerUser.findOne({ email: user.email });
    } else if (user.role === ENUM_USER_ROLE.SELLER) {
      roleUser = await Seller.findOne({ email: user.email });
    } else if (user.role === ENUM_USER_ROLE.ADMIN) {
      roleUser = await Admin.findOne({ email: user.email });
    }

    if (roleUser) {
      throw new ApiError(400, 'Email is already available');
    }

    if (user.isModified('password')) {
      user.password = await bcrypt.hash(
        user.password,
        Number(config.bycrypt_salt_rounds),
      );
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// after then save data then call this hook
userSchema.post('save', async function (data, next) {
  try {
    data.password = '';
    await redisClient.set(
      ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_USERS + data?._id,
      JSON.stringify(data),
      'EX',
      24 * 60, // 1 day to second
    );
    next();
  } catch (error: any) {
    next(error);
  }
});
// after then save data then call this hook
userSchema.post('findOneAndUpdate', async function (data, next) {
  try {
    data.password = '';
    await redisClient.set(
      ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_USERS + data?._id,
      JSON.stringify(data),
      'EX',
      24 * 60, // 1 day to second
    );
    next();
  } catch (error: any) {
    next(error);
  }
});
// after then save data then call this hook
userSchema.post('findOneAndDelete', async function (data, next) {
  try {
    // data.password = '';
    await redisClient.del(ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_USERS + data?._id);
    next();
  } catch (error: any) {
    next(error);
  }
});

export const User = model<IUser, UserModel>('User', userSchema);
//@ts-ignore
const tempUserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      index: true,
      lowercase: true,
    },
    role: {
      type: String,
      required: true,
      enum: USER_ROLE_ARRAY,
      default: ENUM_USER_ROLE.BUYER,
    },
    isEmailVerify: {
      type: String,
      enum: YN_ARRAY,
      default: ENUM_YN.NO,
    },
    authentication: {
      type: {
        otp: Number,
        jwtToken: String,
        timeOut: Date,
        status: {
          type: String,
          enum: STATUS_ARRAY,
          default: ENUM_STATUS.ACTIVE,
        },
      },
    },
    status: {
      type: String,
      enum: STATUS_ARRAY,
      default: ENUM_STATUS.ACTIVE,
    },
    isDelete: {
      type: String,
      enum: YN_ARRAY,
      default: ENUM_YN.NO,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

export const TempUser = model<IUser, UserModel>('TempUser', tempUserSchema);
