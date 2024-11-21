import { Document, Model, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../../global/enum_constant_type';

import { messageZodData } from './messages.validation';

export type IChatMessageFilters = {
  senderUserId?: string;
  senderRoleBaseId?: string;
  receiverUserId?: string;
  receiverRoleBaseId?: string;
  friendShipId?: string;
  findMyChats?: I_YN;
  //
  gigId?: string;
  orderId?: string;
  uuid?: string;
  //
  searchTerm?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: boolean | string;
  isSeen?: boolean | string;
};

export type IChatMessage = z.infer<typeof messageZodData> & {
  //
  _id: string | Types.ObjectId;
  //
} & Document;
export type ChatMessageModel = {
  isChatMessageExistMethod(
    id: string,
    option: {
      isDelete?: boolean;
      populate?: boolean;
    },
  ): Promise<IChatMessage>;
} & Model<IChatMessage, Record<string, unknown>>;
