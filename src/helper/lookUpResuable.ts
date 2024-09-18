/* eslint-disable @typescript-eslint/no-unused-vars */
import { PipelineStage } from 'mongoose';
import { ENUM_USER_ROLE } from '../global/enums/users';

export type ILookupCollection<P> = {
  connectionName: string;
  idFiledName: string;
  pipeLineMatchField?: string;
  outPutFieldName?: string;
  margeInField?: string;
  project?: Partial<Record<keyof P, number>>;
};
type IPipelineOptions<P, T> = {
  spliceStart?: number;
  spliceEnd?: number;
  // filter?: T;
  collections: ILookupCollection<P>[];
};

export const LookupReusable = <P, T>(
  pipeline: PipelineStage[],
  option: IPipelineOptions<P, T>,
) => {
  const { collections } = option;
  const mapFunction = ({
    connectionName,
    idFiledName,
    pipeLineMatchField,
    outPutFieldName,
    margeInField,
    project,
  }: ILookupCollection<P>) => {
    let modifyProject = {};
    if (project && Object.keys(project).length) {
      modifyProject = project;
    } else {
      modifyProject = { __v: 0 };
    }
    const modifyOutPutField = `${outPutFieldName}`;
    const addPipeline: PipelineStage[] = [
      {
        $lookup: {
          from: connectionName,
          let: {
            id: idFiledName.includes('$') ? idFiledName : `$${idFiledName}`,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    pipeLineMatchField
                      ? pipeLineMatchField.includes('$')
                        ? pipeLineMatchField
                        : `$${pipeLineMatchField}`
                      : '_id',
                    '$$id',
                  ],
                },
                // Additional filter conditions for collection2
              },
            },

            // Additional stages for collection2
            { $project: modifyProject },
          ],
          as: modifyOutPutField, //`{outPutFieldName || idFiledName}IdDetails`
        },
      },

      //মনে রাখতে হবে যদি এটি দেওয়া না হয় তাহলে সে যখন কোন একটি ক্যাটাগরির থাম্বেল না পাবে সে তাকে দেবে না
      /*    {
        $addFields: {
          [`${outPutFieldName}Details`]: {
            $cond: {
              if: { $eq: [{ $size: `$${outPutFieldName}IdDetails` }, 0] },
              then: [{}],
              else: `$${outPutFieldName}IdDetails`,
            },
          },
        },
      },
      {
        $project: { [`${outPutFieldName}IdDetails`]: 0 },
      },
      {
        $unwind: `$${outPutFieldName}Details`,
      }, */
      //Alternative
    ];

    if (margeInField) {
      addPipeline.push(
        {
          $addFields: {
            [margeInField]: {
              $cond: {
                if: {
                  $and: [
                    {
                      $isArray: `$${modifyOutPutField}`,
                    },
                    {
                      $eq: [
                        {
                          $size: `$${modifyOutPutField}`,
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: `$${margeInField.toString()}`, //seller ->{}
                else: {
                  $mergeObjects: [
                    {
                      //which field is replace and this filed in add object name outPutFieldName --{role:"admin",userId:"dd",useDetails:{}}
                      [modifyOutPutField]: {
                        $arrayElemAt: [`$${modifyOutPutField}`, 0],
                      },
                    },
                    `$${margeInField.toString()}`, //seller ->{}
                    // { newField: 'newValue' },
                  ],
                },
              },
            },
          },
        },
        {
          $project: { [modifyOutPutField]: 0 },
        },
      );
    } else {
      addPipeline.push({
        $addFields: {
          [modifyOutPutField]: {
            $cond: {
              if: {
                $and: [
                  {
                    $isArray: `$${modifyOutPutField}`,
                  },
                  {
                    $eq: [
                      {
                        $size: `$${modifyOutPutField}`,
                      },
                      0,
                    ],
                  },
                ],
              },
              then: {},
              else: {
                $arrayElemAt: [`$${modifyOutPutField}`, 0],
              },
            },
          },
        },
      });
    }

    if (option?.spliceStart) {
      const { spliceStart, spliceEnd } = option;
      pipeline.splice(spliceStart, spliceEnd || 0, ...addPipeline);
    } else {
      //default use
      pipeline.push(...addPipeline);
    }
  };
  collections.forEach(mapFunction);
};
//
//
//
//!----------------------------------LookupAnyRoleDetailsReusable---------------------------
type ILookupCollectionV2 = {
  roleMatchFiledName: string;
  idFiledName: string;
  pipeLineMatchField: string;
  outPutFieldName: string;
  margeInField?: string;
  project?: Record<string, number>;
};

type IPipelineOptionsV2<T> = {
  spliceStart?: number;
  spliceEnd?: number;
  filter?: T;
  collections: ILookupCollectionV2[];
};
export const LookupAnyRoleDetailsReusable = <T>(
  pipeline: PipelineStage[],
  option: IPipelineOptionsV2<T>,
) => {
  const { collections } = option;
  const mapFunction = ({
    roleMatchFiledName,
    idFiledName,
    pipeLineMatchField,
    outPutFieldName,
    margeInField,
    project,
  }: ILookupCollectionV2) => {
    let modifyProject = {};
    if (project && Object.keys(project).length) {
      modifyProject = project;
    } else {
      modifyProject = { __v: 0 };
    }
    const addPipeline: PipelineStage[] = [
      //!-----------------car-aggregate----start------
      {
        $facet: {
          superAdminInfo: [
            {
              $match: {
                [roleMatchFiledName]: ENUM_USER_ROLE.superAdmin,
              },
            },
            //admin
            {
              $lookup: {
                from: 'admins',
                let: {
                  id: idFiledName.includes('$')
                    ? idFiledName
                    : `$${idFiledName}`,
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          pipeLineMatchField
                            ? pipeLineMatchField.includes('$')
                              ? pipeLineMatchField
                              : `$${pipeLineMatchField}`
                            : '_id',
                          '$$id',
                        ],
                      },
                      // Additional filter conditions for collection2
                    },
                  },

                  // Additional stages for collection2
                  { $project: modifyProject },
                ],
                as: 'superAdminDetails',
              },
            },

            //মনে রাখতে হবে যদি এটি দেওয়া না হয় তাহলে সে যখন কোন একটি ক্যাটাগরির থাম্বেল না পাবে সে তাকে দেবে না
            {
              $addFields: {
                [outPutFieldName]: {
                  $cond: {
                    if: { $eq: [{ $size: '$superAdminDetails' }, 0] },
                    then: [{}],
                    else: '$superAdminDetails',
                  },
                },
              },
            },
            {
              $project: { superAdminDetails: 0 },
            },
            {
              $unwind: `$${outPutFieldName}`,
            },
          ],
          adminInfo: [
            {
              $match: {
                [roleMatchFiledName]: ENUM_USER_ROLE.admin,
              },
            },
            //admin
            {
              $lookup: {
                from: 'admins',
                let: {
                  id: idFiledName.includes('$')
                    ? idFiledName
                    : `$${idFiledName}`,
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          pipeLineMatchField
                            ? pipeLineMatchField.includes('$')
                              ? pipeLineMatchField
                              : `$${pipeLineMatchField}`
                            : '_id',
                          '$$id',
                        ],
                      },
                      // Additional filter conditions for collection2
                    },
                  },
                  // Additional stages for collection2
                  { $project: modifyProject },
                ],
                as: 'adminDetails',
              },
            },

            //মনে রাখতে হবে যদি এটি দেওয়া না হয় তাহলে সে যখন কোন একটি ক্যাটাগরির থাম্বেল না পাবে সে তাকে দেবে না
            {
              $addFields: {
                [outPutFieldName]: {
                  $cond: {
                    if: { $eq: [{ $size: '$adminDetails' }, 0] },
                    then: [{}],
                    else: '$adminDetails',
                  },
                },
              },
            },
            {
              $project: { adminDetails: 0 },
            },
            {
              $unwind: `$${outPutFieldName}`,
            },
          ],

          employeeInfo: [
            {
              $match: {
                [roleMatchFiledName]: ENUM_USER_ROLE.employee,
              },
            },
            //!--------------generalUser-------start----------
            {
              $lookup: {
                from: 'employees',
                let: {
                  id: idFiledName.includes('$')
                    ? idFiledName
                    : `$${idFiledName}`,
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          pipeLineMatchField
                            ? pipeLineMatchField.includes('$')
                              ? pipeLineMatchField
                              : `$${pipeLineMatchField}`
                            : '_id',
                          '$$id',
                        ],
                      },
                      // Additional filter conditions for collection2
                    },
                  },
                  // Additional stages for collection2
                  { $project: modifyProject },
                ],
                as: 'employeeDetails',
              },
            },

            //মনে রাখতে হবে যদি এটি দেওয়া না হয় তাহলে সে যখন কোন একটি ক্যাটাগরির থাম্বেল না পাবে সে তাকে দেবে না
            {
              $addFields: {
                [outPutFieldName]: {
                  $cond: {
                    if: { $eq: [{ $size: '$employeeDetails' }, 0] },
                    then: [{}],
                    else: '$employeeDetails',
                  },
                },
              },
            },
            {
              $project: { employeeDetails: 0 },
            },
            {
              $unwind: `$${outPutFieldName}`,
            },
          ],
          hradminInfo: [
            {
              $match: {
                [roleMatchFiledName]: ENUM_USER_ROLE.hrAdmin,
              },
            },
            //!--------------hostUser-------start----------
            {
              $lookup: {
                from: 'hradmins',
                let: {
                  id: idFiledName.includes('$')
                    ? idFiledName
                    : `$${idFiledName}`,
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          pipeLineMatchField
                            ? pipeLineMatchField.includes('$')
                              ? pipeLineMatchField
                              : `$${pipeLineMatchField}`
                            : '_id',
                          '$$id',
                        ],
                      },
                      // Additional filter conditions for collection2
                    },
                  },
                  // Additional stages for collection2
                  { $project: modifyProject },
                ],
                as: 'hradminsDetails',
              },
            },

            //মনে রাখতে হবে যদি এটি দেওয়া না হয় তাহলে সে যখন কোন একটি ক্যাটাগরির থাম্বেল না পাবে সে তাকে দেবে না
            {
              $addFields: {
                [outPutFieldName]: {
                  $cond: {
                    if: { $eq: [{ $size: '$hradminsDetails' }, 0] },
                    then: [{}],
                    else: '$hradminsDetails',
                  },
                },
              },
            },
            {
              $project: { hradminsDetails: 0 },
            },
            {
              $unwind: `$${outPutFieldName}`,
            },
          ],
        },
      },
      {
        $project: {
          userData: {
            $concatArrays: [
              '$superAdminInfo',
              '$adminInfo',
              '$hradminInfo',
              '$employeeInfo',
            ], // Concatenate arrays into a single array
          },
        },
      },
      {
        $unwind: '$userData', // Unwind the array to separate documents
      },
      {
        $replaceRoot: { newRoot: '$userData' }, // Replace the root with the documents from the array
      },
    ];
    if (margeInField) {
      addPipeline.push(
        {
          $addFields: {
            [margeInField]: {
              $cond: {
                if: {
                  $and: [
                    {
                      $isArray: `$${outPutFieldName}`,
                    },
                    {
                      $eq: [
                        {
                          $size: `$${outPutFieldName}`,
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: `$${margeInField.toString()}`, //seller ->{}
                else: {
                  $mergeObjects: [
                    {
                      //which field is replace and this filed in add object name outPutFieldName --{role:"admin",userId:"dd",useDetails:{}}
                      [outPutFieldName]: `$${outPutFieldName}`,
                    },
                    `$${margeInField.toString()}`, //seller ->{}
                    // { newField: 'newValue' },
                  ],
                },
              },
            },
          },
        },
        {
          $project: { [outPutFieldName]: 0 },
        },
      );
    }

    if (option?.spliceStart) {
      const { spliceStart, spliceEnd } = option;
      pipeline.splice(spliceStart, spliceEnd || 0, ...addPipeline);
    } else {
      pipeline.push(...addPipeline);
    }
  };
  //
  collections.forEach(mapFunction);
};

/*  
     {
        $facet: {
          superAdminInfo: [
            {
              $match: {
                role: ENUM_USER_ROLE.superAdmin,
              },
            },
            //admin
            {
              $lookup: {
                from: 'admins',
                let: { email: '$email' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$email', '$$email'] },
                      // Additional filter conditions for collection2
                    },
                  },
                  // Additional stages for collection2
                ],
                as: 'superAdminDetails',
              },
            },

            //মনে রাখতে হবে যদি এটি দেওয়া না হয় তাহলে সে যখন কোন একটি ক্যাটাগরির থাম্বেল না পাবে সে তাকে দেবে না
            {
              $addFields: {
                roleInfo: {
                  $cond: {
                    if: { $eq: [{ $size: '$superAdminDetails' }, 0] },
                    then: [{}],
                    else: '$superAdminDetails',
                  },
                },
              },
            },
            {
              $project: { superAdminDetails: 0 },
            },
            {
              $unwind: '$roleInfo',
            },
          ],
          adminInfo: [
            {
              $match: {
                role: ENUM_USER_ROLE.admin,
              },
            },
            //admin
            {
              $lookup: {
                from: 'admins',
                let: { email: '$email' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$email', '$$email'] },
                      // Additional filter conditions for collection2
                    },
                  },
                  // Additional stages for collection2
                ],
                as: 'adminDetails',
              },
            },

            //মনে রাখতে হবে যদি এটি দেওয়া না হয় তাহলে সে যখন কোন একটি ক্যাটাগরির থাম্বেল না পাবে সে তাকে দেবে না
            {
              $addFields: {
                roleInfo: {
                  $cond: {
                    if: { $eq: [{ $size: '$adminDetails' }, 0] },
                    then: [{}],
                    else: '$adminDetails',
                  },
                },
              },
            },
            {
              $project: { adminDetails: 0 },
            },
            {
              $unwind: '$roleInfo',
            },
          ],

          generalUserInfo: [
            {
              $match: {
                role: ENUM_USER_ROLE.employee,
              },
            },
            //!--------------generalUser-------start----------
            {
              $lookup: {
                from: 'generalusers',
                let: { email: '$email' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$email', '$$email'] },
                      // Additional filter conditions for collection2
                    },
                  },
                  // Additional stages for collection2
                ],
                as: 'generalUserDetails',
              },
            },

            //মনে রাখতে হবে যদি এটি দেওয়া না হয় তাহলে সে যখন কোন একটি ক্যাটাগরির থাম্বেল না পাবে সে তাকে দেবে না
            {
              $addFields: {
                roleInfo: {
                  $cond: {
                    if: { $eq: [{ $size: '$generalUserDetails' }, 0] },
                    then: [{}],
                    else: '$generalUserDetails',
                  },
                },
              },
            },
            {
              $project: { generalUserDetails: 0 },
            },
            {
              $unwind: '$roleInfo',
            },
          ],
          hostUserInfo: [
            {
              $match: {
                role: ENUM_USER_ROLE.hrAdmin,
              },
            },
            //!--------------hostUser-------start----------
            {
              $lookup: {
                from: 'hostusers',
                let: { email: '$email' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$email', '$$email'] },
                      // Additional filter conditions for collection2
                    },
                  },
                  // Additional stages for collection2
                ],
                as: 'hostUserDetails',
              },
            },

            //মনে রাখতে হবে যদি এটি দেওয়া না হয় তাহলে সে যখন কোন একটি ক্যাটাগরির থাম্বেল না পাবে সে তাকে দেবে না
            {
              $addFields: {
                roleInfo: {
                  $cond: {
                    if: { $eq: [{ $size: '$hostUserDetails' }, 0] },
                    then: [{}],
                    else: '$hostUserDetails',
                  },
                },
              },
            },
            {
              $project: { hostUserDetails: 0 },
            },
            {
              $unwind: '$roleInfo',
            },
          ],
        },
      },
      {
        $project: {
          userData: {
            $concatArrays: [
              '$adminInfo',
              '$generalUserInfo',
              '$hostUserInfo',
              '$superAdminInfo',
            ], // Concatenate arrays into a single array
          },
        },
      },
      {
        $unwind: '$userData', // Unwind the array to separate documents
      },
      {
        $replaceRoot: { newRoot: '$userData' }, // Replace the root with the documents from the array
      },

      
       */
