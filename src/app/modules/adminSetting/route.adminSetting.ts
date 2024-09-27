import express from 'express';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import authMiddleware from '../../middlewares/authMiddleware';

import { uploadImage } from '../../middlewares/uploader.multer';
import parseBodyData from '../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { AdminSettingController } from './constroller.adminSetting';
import { AdminSettingValidation } from './validation.adminSetting';

const router = express.Router();

router
  .route('/')
  // This route is open
  .get(AdminSettingController.getAllAdminSetting)
  .post(
    authMiddleware(ENUM_USER_ROLE.admin, ENUM_USER_ROLE.superAdmin),

    // uploadAwsS3Bucket.single('image'),
    uploadImage.single('image'),
    parseBodyData({}),
    validateRequestZod(AdminSettingValidation.createAdminSettingZodSchema),
    AdminSettingController.createAdminSetting,
  );

router
  .route('/:id')
  // This route is open
  .get(AdminSettingController.getSingleAdminSetting)
  .patch(
    authMiddleware(ENUM_USER_ROLE.admin, ENUM_USER_ROLE.superAdmin),

    // uploadAwsS3Bucket.single('image'),
    uploadImage.single('image'),
    parseBodyData({}),
    validateRequestZod(AdminSettingValidation.updateAdminSettingZodSchema),
    AdminSettingController.updateAdminSetting,
  )
  .delete(
    authMiddleware(ENUM_USER_ROLE.admin, ENUM_USER_ROLE.superAdmin),
    AdminSettingController.deleteAdminSetting,
  );

export const AdminSettingRoute = router;
