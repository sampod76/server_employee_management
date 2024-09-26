import { z } from 'zod';
import { I_STATUS, STATUS_ARRAY } from '../../../global/enum_constant_type';
import { zodFileAfterUploadSchema } from '../../../global/schema/global.schema';

import {
  AdminSettingTypeArray,
  I_AdminSettingType,
  I_PaymentTimeType,
  PaymentTimeTypeArray,
} from './interface.adminSetting';

const createAdminSettingBodyData = z.object({
  title: z.string().optional(),
  settingType: z.enum(
    AdminSettingTypeArray as [I_AdminSettingType, ...I_AdminSettingType[]],
  ),
  percentageValue: z.number().optional(),
  paymentTime: z
    .object({
      number: z.number(),
      timeType: z.enum(
        PaymentTimeTypeArray as [I_PaymentTimeType, ...I_PaymentTimeType[]],
      ),
    })
    .optional(),

  image: zodFileAfterUploadSchema.optional(),
  status: z.enum(STATUS_ARRAY as [I_STATUS, ...I_STATUS[]]).optional(),
});

const updateAdminSettingBodyData = createAdminSettingBodyData.merge(
  z.object({
    isDelete: z.boolean().optional().default(false),
  }),
);

const createAdminSettingZodSchema = z.object({
  body: createAdminSettingBodyData,
});
const updateAdminSettingZodSchema = z.object({
  body: updateAdminSettingBodyData.deepPartial(),
});
export const AdminSettingValidation = {
  createAdminSettingZodSchema,
  updateAdminSettingZodSchema,
  updateAdminSettingBodyData,
};
