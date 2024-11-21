import { Model, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../../global/enum_constant_type';

import { IUserRef } from '../../allUser/typesAndConst';
import { GroupsValidation } from './validation.groups';

export type IGroupsFilters = {
  authorUserId?: string;
  authorRoleBaseId?: string;
  paymentId?: string;
  projectStart?: string;
  projectDeadline?: string;
  orderId?: string;
  isBlock?: I_YN;
  myData?: I_YN;

  //
  searchTerm?: string;
  needProperty?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: I_YN;
  createdAtFrom?: string;
  createdAtTo?: string;
};

export type IGroups = z.infer<typeof GroupsValidation.GroupsBodyZodData> &
  z.infer<typeof GroupsValidation.GroupsUpdateBodyDate> & {
    _id?: Types.ObjectId | string;
    members: {
      total: number;
    };
    paymentId: string | Types.ObjectId;
    cs_id: string;
    author: IUserRef;
    // gigId?: Types.ObjectId | string;
    // orderId?: Types.ObjectId | string;
  };
export type GroupsModel = {
  isGroupsExistMethod(
    id: string,
    option: {
      isDelete?: I_YN;
      populate?: boolean;
    },
  ): Promise<IGroups>;
} & Model<IGroups, Record<string, unknown>>;
