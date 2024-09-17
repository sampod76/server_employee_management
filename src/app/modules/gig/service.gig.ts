/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request } from 'express';
import httpStatus from 'http-status';
import { PipelineStage, Schema, Types } from 'mongoose';
import { ENUM_YN } from '../../../global/enum_constant_type';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { paginationHelper } from '../../../helper/paginationHelper';
import ApiError from '../../errors/ApiError';
import { IGenericResponse } from '../../interface/common';
import { IPaginationOption } from '../../interface/pagination';

import {
  ILookupCollection,
  LookupReusable,
} from '../../../helper/lookUpResuable';
import { ISellerUser } from '../allUser/hrAdmin/interface.seller';
import { ENUM_VERIFY, IUserRef } from '../allUser/typesAndConst';
import { ICategory } from '../category/interface.category';
import { GigSearchableFields } from './constants.gig';
import { IGig, IGigFilters } from './interface.gig';
import { Gig } from './models.gig';

const createGig = async (data: IGig, req?: Request): Promise<IGig | null> => {
  //check validation work model in pre hook
  const res = await Gig.create(data);
  return res;
};

const getAllGigsFromDB = async (
  filters: IGigFilters,
  paginationOptions: IPaginationOption,
  user?: IUserRef,
  req?: Request,
): Promise<IGenericResponse<IGig[] | null>> => {
  const {
    searchTerm,
    createdAtFrom,
    createdAtTo,
    needProperty,
    selectField,
    ...filtersData
  } = filters;
  filtersData.isDelete = filtersData.isDelete
    ? filtersData.isDelete == 'true'
      ? true
      : false
    : false;
  filtersData.verify = filtersData.verify
    ? filtersData.verify
    : ENUM_VERIFY.ACCEPT;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      $or: GigSearchableFields.map((field: string) => ({
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
        if (field === 'sellerUserId') {
          modifyFiled = {
            ['seller.userId']: new Types.ObjectId(value),
          };
        } else if (field === 'sellerRoleUserId') {
          modifyFiled = {
            ['seller.roleBaseUserId']: new Types.ObjectId(value),
          };
        } else if (field === 'category') {
          modifyFiled = { [field]: new Types.ObjectId(value) };
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
      //only single data in register all data -> 2022-02-25_12:00_am to 2022-02-25_11:59 pm minutes
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
  //********************end of filter conditions**************

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
    { $skip: Number(skip) || 0 },
    { $limit: Number(limit) || 10 },
    {
      $addFields: {
        basicPrice: { $first: '$packages.price' },
      },
    },
  ];
  //***************projection some filed**************
  const project: Record<string, number> = { packages: 0, __v: 0 };
  if (selectField) {
    selectField.split(',').forEach((field: string) => {
      //default is some large data remove but when show full data then remove
      delete project[field.trim()];
    });
  }
  const projection: PipelineStage = {
    $project: project,
  };
  pipeline.push(projection);

  //!-----------------------start --lookup-----------------
  // Define the collections array with the correct type
  const collections: ILookupCollection<any>[] = []; // Use the correct type here
  // Create an object of type ILookupCollection<ISellerUser>

  // console.log(needProperty);
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

  if (needProperty && needProperty.includes('category')) {
    const categoryCollection: ILookupCollection<ICategory> = {
      connectionName: 'categories',
      idFiledName: 'category',
      pipeLineMatchField: '_id',
      outPutFieldName: 'categoryDetails',
    };
    collections.push(categoryCollection);
  }
  if (needProperty?.toLowerCase()?.includes('averageRatings'.toLowerCase())) {
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
                    { $eq: ['$reviewer.role', ENUM_USER_ROLE.employee] },
                    { $eq: ['$isDelete', ENUM_YN.NO] },
                    // { $ne: ['$author.roleBaseUserId', '$$hostUserId'] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null, // or you can use a specific field to group by
                mainAverage: { $avg: '$overallRating' },
              },
            },
            {
              $addFields: {
                average: { $floor: '$mainAverage' },
              },
            },
            // {
            //   $project: { mainAverage: 0 },
            // },
          ],
          as: 'averageRatingDetails',
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $eq: [{ $size: '$averageRatingDetails' }, 0] },
              then: [{ average: 0 }],
              else: '$averageRatingDetails',
            },
          },
        },
      },
      { $unwind: '$averageRating' },
      { $project: { averageRatingDetails: 0 } },
    ];
    pipeline.push(...secondPipeline);
  }

  // Use the collections in LookupReusable
  LookupReusable<any, any>(pipeline, {
    collections: collections,
    // spliceStart:4
  });
  //!-------------------------lookup------------------------

  // const result = await Gig.aggregate(pipeline);
  // const total = await Gig.countDocuments(whereConditions);
  //!-- alternatively and faster
  const pipeLineResult = await Gig.aggregate([
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

const updateGigFromDB = async (
  id: string,
  data: IGig,
  user: IUserRef,
  req?: Request,
): Promise<IGig | null> => {
  const isExist = (await Gig.findById(id)) as IGig & {
    _id: Schema.Types.ObjectId;
  } as IGig;
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Gig not found');
  }
  if (
    user?.role !== ENUM_USER_ROLE.superAdmin &&
    user?.role !== ENUM_USER_ROLE.admin &&
    isExist?.seller?.userId?.toString() !== user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  const { packages, ...GigData } = data;
  if (
    user?.role !== ENUM_USER_ROLE.superAdmin &&
    user?.role !== ENUM_USER_ROLE.admin
  ) {
    delete (GigData as Partial<IGig>)['isDelete']; // remove it because , any user update time to not update this field , when user apply delete route to modify this field
  }
  const updatedGigData: Partial<IGig> = { ...GigData };
  if (packages && Object.keys(packages).length) {
    Object.keys(packages).forEach(key => {
      const nameKey = `packages.${key}` as keyof Partial<IGig>; //key
      const singlePackageData = packages[key as keyof typeof packages]; //value

      if (singlePackageData) {
        (updatedGigData[nameKey] as any) = singlePackageData;
        if (Object.keys(singlePackageData).length) {
          Object.keys(singlePackageData).forEach(key2 => {
            const secondChildKey = `${nameKey}.${key2}` as keyof Partial<IGig>; //key
            const secondChildData =
              singlePackageData[key2 as keyof typeof singlePackageData]; //value
            (updatedGigData[secondChildKey] as any) = secondChildData;
          });
        }
      }
    });
  }

  const updatedGig = await Gig.findOneAndUpdate({ _id: id }, updatedGigData, {
    new: true,
    runValidators: true,
  });
  if (!updatedGig) {
    throw new ApiError(400, 'Failed to update Gig');
  }
  return updatedGig;
};

const getSingleGigFromDB = async (
  id: string,
  user?: IUserRef,
  req?: Request,
): Promise<IGig | null> => {
  const query = req?.query?.needProperty as string;
  const data = await Gig.isGigExistMethod(id, {
    populate: true,
    needProperty: query?.split(',')?.map(property => property.trim()),
  });

  return data;
};

const deleteGigFromDB = async (
  id: string,
  query: IGigFilters,
  user: IUserRef,
  req: Request,
): Promise<IGig | null> => {
  // const isExist = (await Gig.findById(id).select('+password')) as IGig & {
  //   _id: Schema.Types.ObjectId;
  // };
  const isExist = (await Gig.aggregate([
    { $match: { _id: new Types.ObjectId(id), isDelete: ENUM_YN.NO } },
  ])) as IGig[];

  if (!isExist.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Gig not found');
  }

  if (
    user?.role !== ENUM_USER_ROLE.admin &&
    user?.role !== ENUM_USER_ROLE.superAdmin &&
    isExist[0]?.seller?.userId?.toString() !== user?.userId
  ) {
    throw new ApiError(403, 'forbidden access');
  }

  let data;

  if (
    query.delete == ENUM_YN.YES && // this is permanently delete but store trash collection
    (user?.role == ENUM_USER_ROLE.admin ||
      user?.role == ENUM_USER_ROLE.superAdmin)
  ) {
    // data = await Gig.findOneAndDelete({ _id: id });
    data = null;
  } else {
    data = await Gig.findOneAndUpdate(
      { _id: id },
      { isDelete: true },
      { new: true, runValidators: true },
    );
  }
  return data;
};

export const GigService = {
  createGig,
  getAllGigsFromDB,
  updateGigFromDB,
  getSingleGigFromDB,
  deleteGigFromDB,
};
