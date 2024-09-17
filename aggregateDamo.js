/* 



    //!-----------------admin-aggregate----start------
   //
            {
      $lookup: {
        from: 'admins',
        let: { id: '$author.roleBaseUserId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ['$$id', null] },
                  { $ne: ['$$id', undefined] },
                  { $eq: ['$_id', '$$id'] },
                ],
              },
              // Additional filter conditions for collection2
            },
          },
          {
            $project: {
              __v: 0,
            },
          },
          // Additional stages for collection2
        ],
        as: 'adminDetails',
      },
    },
    {
      $addFields: {
        adminDetails: {
          $cond: {
            if: { $eq: [{ $size: '$adminDetails' }, 0] },
            then: {},
            else: { $arrayElemAt: ['$adminDetails', 0] },
          },
        },
      },
    },
    //!-----------------admin-aggregate----end------


*/

/* //!------- friendship ----------------

{
    $or: [
      {
        'sender.userId': new Types.ObjectId(data.sender?.userId as string),
        'receiver.userId': new Types.ObjectId(data.receiver?.userId as string),
      },
      {
        'sender.userId': new Types.ObjectId(data.receiver?.userId as string),
        'receiver.userId': new Types.ObjectId(data.sender?.userId as string),
      },
    ],
  }

*/
