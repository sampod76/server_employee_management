import { Model, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../global/enum_constant_type';

import { IUserRef } from '../allUser/typesAndConst';
import { friendshipValidation } from './friendship.validation';

export type IFriendShipFilters = {
  senderUserId?: string;
  senderRoleBaseId?: string;
  receiverUserId?: string;
  receiverRoleBaseId?: string;
  requestAccept?: string | boolean;
  isBlock?: string | boolean;
  myData?: I_YN;
  //
  delete?: I_YN;
  searchTerm?: string;
  needProperty?: string;
  status?: I_STATUS;
  createdAtFrom?: string;
  createdAtTo?: string;
  isDelete?: string | boolean;
};

export type IFriendShip = z.infer<
  typeof friendshipValidation.friendshipBodyZodData
> &
  z.infer<typeof friendshipValidation.friendshipUpdateBodyDate> &
  z.infer<typeof friendshipValidation.friendshipBlockZodData> & {
    sender: IUserRef;
    _id?: Types.ObjectId | string;
    lastMessage: {
      message: string;
      messageId: string | Types.ObjectId;
      createdAt: Date;
    };
  };
export type FriendShipModel = {
  isFriendShipExistMethod(
    id: string,
    option: {
      isDelete?: boolean;
      populate?: boolean;
    },
  ): Promise<IFriendShip>;
} & Model<IFriendShip, Record<string, unknown>>;
