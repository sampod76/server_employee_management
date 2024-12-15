import { Model, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../../global/enum_constant_type';

import { groupMessageZodData } from './validation.groupMessage';

export type IGroupMessageFilters = {
  senderUserId?: string;
  senderRoleBaseId?: string;
  groupId?: string;
  groupMemberId?: string;
  findMyChats?: I_YN;
  //
  orderId?: string;
  uuid?: string;
  //
  searchTerm?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: boolean | string;
  isSeen?: boolean | string;
};

export type IGroupMessage = z.infer<typeof groupMessageZodData> & {
  //
  _id: string | Types.ObjectId;
  //
};
export type GroupMessageModel = {
  isGroupMessageExistMethod(
    id: string,
    option: {
      isDelete?: boolean;
      populate?: boolean;
    },
  ): Promise<IGroupMessage>;
} & Model<IGroupMessage, Record<string, unknown>>;
