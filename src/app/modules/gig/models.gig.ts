import { model, PipelineStage, Schema, Types } from 'mongoose';

import {
  ENUM_STATUS,
  ENUM_YN,
  I_YN,
  STATUS_ARRAY,
  YN_ARRAY,
} from '../../../global/enum_constant_type';

import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { mongooseFileSchema } from '../../../global/schema/global.schema';
import {
  ILookupCollection,
  LookupReusable,
} from '../../../helper/lookUpResuable';
import ApiError from '../../errors/ApiError';
import { ISellerUser } from '../allUser/seller/interface.seller';
import {
  ENUM_VERIFY,
  mongooseIUserRef,
  VERIFY_ARRAY,
} from '../allUser/typesAndConst';
import { ICategory } from '../category/interface.category';
import { GigModel, IGig } from './interface.gig';
import { ORDER_PACKAGE_NAME_ARRAY } from './validation.gig';

export const mongoosePackageSchema = {
  packageName: { type: String, enum: ORDER_PACKAGE_NAME_ARRAY },
  price: Number,
  deliveryTime: Number, //days:Number,
  featuresList: [{ title: String }],
  serialNumber: Number,
};

const GigSchema = new Schema<IGig, GigModel>(
  {
    seller: mongooseIUserRef,
    title: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    additionalDescription: { type: String, trim: true },
    weoffer: [{ title: { type: String, trim: true } }],
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    // packages: {
    //   bronze: mongoosePackageSchema, //[]
    //   silver: mongoosePackageSchema, //[]
    //   gold: mongoosePackageSchema, //[]
    //   extraPackage: mongoosePackageSchema, //[]
    // },
    packages: [mongoosePackageSchema],

    images: [mongooseFileSchema],
    tags: {
      type: [String],
      index: true, //
    },
    status: {
      type: String,
      enum: STATUS_ARRAY,
      default: ENUM_STATUS.ACTIVE,
    },
    verify: {
      type: String,
      enum: VERIFY_ARRAY,
      default: ENUM_VERIFY.PENDING,
    },
    isDelete: {
      type: String,
      enum: YN_ARRAY,
      default: ENUM_YN.NO,
    },
    //--- for --TrashCategory---
  },
  {
    timestamps: true,
  },
);
GigSchema.statics.isGigExistMethod = async function (
  id: string,
  option?: {
    isDelete?: I_YN;
    populate?: boolean;
    needProperty?: string[];
  },
): Promise<IGig | null> {
  let data;
  if (!option?.populate) {
    const result = await Gig.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDelete: option?.isDelete || ENUM_YN.NO,
        },
      },
    ]);
    data = result[0];
  } else {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDelete: option.isDelete || ENUM_YN.NO,
        },
      },
    ];
    //!-----------------------start --lookup-----------------
    // Define the collections array with the correct type
    const collections: ILookupCollection<any>[] = []; // Use the correct type here
    // Create an object of type ILookupCollection<ISellerUser>
    const sellerCollection: ILookupCollection<ISellerUser> = {
      connectionName: 'sellers',
      idFiledName: 'seller.roleBaseUserId',
      pipeLineMatchField: '_id',
      outPutFieldName: 'details',
      margeInField: 'seller', // Ensure this is a valid key in current collection
      //project: { name: 1, country: 1, profileImage: 1, email: 1 },
    };
    // Push the object into the collections array
    collections.push(sellerCollection);

    if (option.needProperty && option.needProperty.includes('category')) {
      const categoryCollection: ILookupCollection<ICategory> = {
        connectionName: 'categories',
        idFiledName: 'category',
        pipeLineMatchField: '_id',
        outPutFieldName: 'categoryDetails',
      };
      collections.push(categoryCollection);
    }
    if (option?.needProperty?.includes('averageRatings')) {
      const secondPipeline: PipelineStage[] = [
        {
          $lookup: {
            from: 'reviews',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$gigId', '$$id'] },
                      { $eq: ['$reviewer.role', ENUM_USER_ROLE.BUYER] },
                      { $eq: ['$isDelete', ENUM_YN.NO] },
                      // { $ne: ['$author.roleBaseUserId', '$$hostUserId'] },
                    ],
                  },
                },
              },

              {
                $facet: {
                  overallRating: [
                    // ratting modify because ratting is some time 2.5/3.8 ect
                    {
                      $project: { overallRating: { $floor: '$overallRating' } }, //2 /3 --convert
                    },

                    {
                      $group: {
                        _id: '$overallRating', // Group by overallRating to get counts for each rating (1-5 stars)
                        count: { $sum: 1 }, // Count the number of reviews per rating
                      },
                    },
                    {
                      $sort: { _id: 1 },
                    },
                    {
                      $group: {
                        _id: null,
                        ratingCounts: {
                          $push: {
                            rating: '$_id', //1/2/3/4/5
                            count: '$count',
                          },
                        },
                      },
                    },
                  ],
                  allRating: [
                    {
                      $group: {
                        _id: null, // or you can use a specific field to group by
                        mainOverallRatingAverage: { $avg: '$overallRating' },
                        mainRecommendAverage: { $avg: '$recommendToFriend' },
                        mainSellerCommunicationLevelAverage: {
                          $avg: '$sellerCommunicationLevel',
                        },
                        mainServiceAsDescribedAverage: {
                          $avg: '$serviceAsDescribed',
                        },
                        // mainAverageCount: { $sum: 1 },
                        // mainRecommendAverageCount: { $sum: 1 },
                      },
                    },
                  ],
                },
              },
              // {
              //   $addFields: {
              //     average: { $floor: '$mainAverage' },
              //   },
              // },
              // {
              //   $project: { mainAverage: 0 },
              // },
            ],
            as: 'averageRatingDetails',
          },
        },
        //https://www.notion.so/sampod/rating-mondb-5ebe90a966004e4ea849a9d18a93d7ed?pvs=4
        {
          $addFields: {
            ratingDetails: {
              $cond: {
                if: { $eq: [{ $size: '$averageRatingDetails' }, 0] },
                then: [{}],
                else: '$averageRatingDetails',
              },
            },
          },
        },
        { $unwind: '$ratingDetails' },
        { $project: { averageRatingDetails: 0 } },
        //https://www.notion.so/sampod/rating-mondb-5ebe90a966004e4ea849a9d18a93d7ed?pvs=4
        {
          $addFields: {
            ['ratingDetails.overallRating']: {
              $cond: {
                if: { $eq: [{ $size: '$ratingDetails.overallRating' }, 0] },
                then: {},
                else: { $arrayElemAt: ['$ratingDetails.overallRating', 0] },
              },
            },
          },
        },
        {
          $addFields: {
            ['ratingDetails.allRating']: {
              $cond: {
                if: { $eq: [{ $size: '$ratingDetails.allRating' }, 0] },
                then: {},
                else: { $arrayElemAt: ['$ratingDetails.allRating', 0] },
              },
            },
          },
        },
      ];
      pipeline.push(...secondPipeline);
    }

    // Use the collections in LookupReusable
    LookupReusable<any, any>(pipeline, {
      collections: collections,
    });
    //!-------------------------lookup------------------------

    const result = await Gig.aggregate(pipeline);

    data = result[0];
  }
  return data;
};
// before save then data then call this hook
GigSchema.pre('save', async function (next) {
  try {
    const data = this as IGig;
    const GigModel = this.constructor as GigModel; // Explicit cast
    const existing = await GigModel.findOne({
      category: new Types.ObjectId(data.category),
      'seller.userId': new Types.ObjectId(data.seller.userId),
      isDelete: ENUM_YN.NO,
    });
    if (existing) {
      throw new ApiError(400, 'Already create the same category gig');
    }

    next();
  } catch (error: any) {
    next(error);
  }
});

export const Gig = model<IGig, GigModel>('Gig', GigSchema);
