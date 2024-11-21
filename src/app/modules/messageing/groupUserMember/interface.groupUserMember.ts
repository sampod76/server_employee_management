import { Model, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../../global/enum_constant_type';

import { IUserRef } from '../../allUser/typesAndConst';
import { GroupMemberValidation } from './validation.groupUserMember';

export type IGroupMemberFilters = {
  senderUserId?: string;
  senderRoleBaseId?: string;
  receiverUserId?: string;
  receiverRoleBaseId?: string;
  groupId?: string;
  orderId?: string;
  isBlock?: boolean | string;
  myData?: I_YN;

  //
  searchTerm?: string;
  needProperty?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: boolean | string;
};
export enum ENUM_GROUP_MEMBER_ROLE_TYPE {
  admin = 'admin',
  member = 'member',
  viewer = 'viewer',
  //
}
type I_GROUP_MEMBER_ROLE_TYPES = keyof typeof ENUM_GROUP_MEMBER_ROLE_TYPE;
export type IGroupMember = z.infer<
  typeof GroupMemberValidation.GroupMemberBodyZodData
> &
  z.infer<typeof GroupMemberValidation.GroupMemberUpdateBodyDate> &
  z.infer<typeof GroupMemberValidation.GroupMemberBlockZodData> & {
    sender: IUserRef;
    _id?: Types.ObjectId | string;
    lastMessage: {
      message: string;
      messageId: string | Types.ObjectId;
      createdAt: Date;
    };
    role: I_GROUP_MEMBER_ROLE_TYPES;
  };
export type GroupMemberModel = {
  isGroupMemberExistMethod(
    id: string,
    option: {
      isDelete?: boolean;
      populate?: boolean;
    },
  ): Promise<IGroupMember>;
} & Model<IGroupMember, Record<string, unknown>>;
