import { Model, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../global/enum_constant_type';

import { IUserRef } from '../allUser/typesAndConst';
import { CheckInOutValidation } from './validation.checkInOut';

export type ICheckInOutFilters = {
  employeeUserId?: string;
  employeeRoleBaseId?: string;

  //
  myData?: I_YN;
  checkInTime?: string;
  checkOutTime?: string;
  toDay?: string;
  isLate?: string | boolean;
  //
  searchTerm?: string;
  needProperty?: string;
  delete?: I_YN;
  status?: I_STATUS;
  isDelete?: string | boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
};

export type ICheckInOut = z.infer<
  typeof CheckInOutValidation.CheckInOut_BodyData
> &
  z.infer<typeof CheckInOutValidation.CheckInOut_UpdateBodyDate> & {
    employee: IUserRef;
    _id?: Types.ObjectId | string;
    isDelete: boolean;
    isLate: boolean;
    checkInTime: string | Date;
    checkOutTime: string | Date;
  };
export type CheckInOutModel = {
  isCheckInOutExistMethod(
    id: string,
    option: {
      isDelete?: boolean;
      populate?: boolean;
      needProperty?: string[];
    },
  ): Promise<ICheckInOut>;
} & Model<ICheckInOut, Record<string, unknown>>;
