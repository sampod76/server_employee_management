import { Document, Model, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../global/enum_constant_type';

import { messageZodData } from './messages.validation';

export type IChatMessageFilters = {
  senderUserId?: string;
  senderRoleBaseId?: string;
  receiverUserId?: string;
  receiverRoleBaseId?: string;
  friendShipId?: string;
  findMyChats?: I_YN;
  //
  searchTerm?: string;

  status?: I_STATUS;
  isDelete?: boolean | string;
  isSeen?: I_YN;
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
