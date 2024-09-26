import { Model } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../global/enum_constant_type';
import { AdminSettingValidation } from './validation.adminSetting';

export type IAdminSettingFilters = {
  searchTerm?: string;
  title?: string;
  settingType?: string;
  status?: I_STATUS;
  delete?: I_YN;
  isDelete?: string | boolean;
};
//
export enum ENUM_ADMIN_SETTING_TYPE {
  percentage = 'percentage',
  paymentTime = 'paymentTime',
}
export type I_AdminSettingType = keyof typeof ENUM_ADMIN_SETTING_TYPE;
export const AdminSettingTypeArray = Object.values(ENUM_ADMIN_SETTING_TYPE);
//
export enum ENUM_PAYMENT_TIME_TYPE {
  day = 'day',
  week = 'week',
  month = 'month',
  year = 'year',
}
export type I_PaymentTimeType = keyof typeof ENUM_PAYMENT_TIME_TYPE;
export const PaymentTimeTypeArray = Object.values(ENUM_PAYMENT_TIME_TYPE);
//
export type IAdminSetting = z.infer<
  typeof AdminSettingValidation.updateAdminSettingBodyData
>;

export type AdminSettingModel = Model<IAdminSetting, Record<string, unknown>>;
