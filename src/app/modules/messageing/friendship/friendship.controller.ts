import { Request, Response } from 'express';

import { PAGINATION_FIELDS } from '../../../../global/constant/pagination';
import catchAsync from '../../../share/catchAsync';
import pick from '../../../share/pick';
import sendResponse from '../../../share/sendResponse';
import { IUserRef } from '../../allUser/typesAndConst';
import { RequestToRefUserObject } from '../../allUser/user/user.utils';
import {
  IServiceNotification,
  sendNotificationFromDB,
} from '../../notification/notification.utls';
import { friendshipFilterableFields } from './friendship.constants';
import { IFriendShip } from './friendship.interface';
import { FriendShipService } from './friendship.service';

const createFriendShip = catchAsync(async (req: Request, res: Response) => {
  req.body = {
    ...req.body,
    sender: RequestToRefUserObject(req.user as IUserRef),
  };
  const result = await FriendShipService.createFriendShip(
    req.body,
    req?.user as IUserRef,
    req,
  );
  sendResponse<IFriendShip>(req, res, {
    statusCode: 200,
    success: true,
    message: 'FriendShip created successfully',
    data: result,
  });

  //--------------notification------
  const data: IServiceNotification<IFriendShip> = [
    {
      userId: result?.receiver?.userId?.toString(),
      message: `Get friend one request`,
      //@ts-ignore
      data: result,
    },
  ];
  sendNotificationFromDB<IFriendShip>(data);
  //-----------end-------------------
});
const checkUserIdToExistFriendShip = catchAsync(
  async (req: Request, res: Response) => {
    const result = await FriendShipService.checkUserIdToExistFriendShipFromDb(
      req.params?.id,
      req?.user as IUserRef,
      req,
    );
    sendResponse<IFriendShip>(req, res, {
      statusCode: 200,
      success: true,
      message: 'FriendShip get successfully',
      data: result,
    });
  },
);

//get all FriendShips
const getAllFriendShips = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, friendshipFilterableFields);
  const paginationOptions = pick(req.query, PAGINATION_FIELDS);

  const result = await FriendShipService.getAllFriendShipsFromDB(
    filters,
    paginationOptions,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'FriendShips found successfully',
    data: result.data,
    meta: result.meta,
  });
});

//get a FriendShip by id
const getFriendShipById = catchAsync(async (req: Request, res: Response) => {
  const result = await FriendShipService.getSingleFriendShipFromDB(
    req.params.id,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'FriendShip found successfully',
    data: result,
  });
});

//update FriendShip
const updateFriendShip = catchAsync(async (req: Request, res: Response) => {
  // await RequestToFileDecodeAddBodyHandle(req);
  const result = await FriendShipService.updateFriendShipFromDB(
    req.params.id,
    req.body,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'FriendShip updated successfully',
    data: result,
  });
});
//update FriendShip
const updateFriendShipBlock = catchAsync(
  async (req: Request, res: Response) => {
    // await RequestToFileDecodeAddBodyHandle(req);
    const result = await FriendShipService.updateFriendShipBlockFromDb(
      req.params.id,
      req.body,
      req,
    );

    sendResponse(req, res, {
      statusCode: 200,
      success: true,
      message: 'FriendShip updated successfully',
      data: result,
    });
  },
);
const updateFriendShipListSort = catchAsync(
  async (req: Request, res: Response) => {
    // await RequestToFileDecodeAddBodyHandle(req);

    const result = await FriendShipService.updateFriendShipListSortFromDb(
      req.params.id,
      req.body,
      req,
    );

    sendResponse(req, res, {
      statusCode: 200,
      success: true,
      message: 'FriendShip updated successfully',
      data: result,
    });
  },
);

//delete FriendShip
const deleteFriendShip = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await FriendShipService.deleteFriendShipFromDB(
    id,
    req.query,
    req,
  );

  sendResponse(req, res, {
    statusCode: 200,
    success: true,
    message: 'review deleted successfully',
    data: result,
  });
});

export const FriendShipsController = {
  createFriendShip,
  getAllFriendShips,
  getFriendShipById,
  updateFriendShip,
  deleteFriendShip,
  updateFriendShipBlock,
  //
  checkUserIdToExistFriendShip,
  updateFriendShipListSort,
};
