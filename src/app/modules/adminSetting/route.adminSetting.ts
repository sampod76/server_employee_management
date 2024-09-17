import express from 'express';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import authMiddleware from '../../middlewares/authMiddleware';

import parseBodyData from '../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { uploadAwsS3Bucket } from '../aws/utls.aws';
import { AdminSettingController } from './constroller.adminSetting';
import { AdminSettingValidation } from './validation.adminSetting';

const router = express.Router();

router
  .route('/')
  // This route is open
  .get(AdminSettingController.getAllAdminSetting)
  .post(
    authMiddleware(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),

    uploadAwsS3Bucket.single('image'),
    parseBodyData({}),
    validateRequestZod(AdminSettingValidation.createAdminSettingZodSchema),
    AdminSettingController.createAdminSetting,
  );

router
  .route('/:id')
  // This route is open
  .get(AdminSettingController.getSingleAdminSetting)
  .patch(
    authMiddleware(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),

    uploadAwsS3Bucket.single('image'),
    parseBodyData({}),
    validateRequestZod(AdminSettingValidation.updateAdminSettingZodSchema),
    AdminSettingController.updateAdminSetting,
  )
  .delete(
    authMiddleware(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    AdminSettingController.deleteAdminSetting,
  );

export const AdminSettingRoute = router;
