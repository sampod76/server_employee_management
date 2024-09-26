import express from 'express';
import { z } from 'zod';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import authMiddleware from '../../../middlewares/authMiddleware';
import { uploadImage } from '../../../middlewares/uploader.multer';
import parseBodyData from '../../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../../middlewares/validateRequestZod';
import { AdminController } from './admin.controller';
import { AdminValidation } from './admin.validation';

const router = express.Router();

router
  .route('/')
  .get(
    authMiddleware(ENUM_USER_ROLE.superAdmin, ENUM_USER_ROLE.admin),
    AdminController.getAllAdmins,
  );
router
  .route('/dashboard')
  .get(
    authMiddleware(ENUM_USER_ROLE.superAdmin, ENUM_USER_ROLE.admin),
    AdminController.dashboard,
  );

router
  .route('/:id')
  .get(
    authMiddleware(ENUM_USER_ROLE.superAdmin, ENUM_USER_ROLE.admin),
    AdminController.getSingleAdmin,
  )
  .patch(
    authMiddleware(ENUM_USER_ROLE.superAdmin, ENUM_USER_ROLE.admin),
    // uploadAwsS3Bucket.fields([{ name: 'profileImage', maxCount: 1 }]),
    // uploadAwsS3Bucket.single('profileImage'),
    uploadImage.single('profileImage'),
    parseBodyData({}),
    validateRequestZod(AdminValidation.updateAdminZodSchema),
    AdminController.updateAdmin,
  )
  .delete(
    authMiddleware(ENUM_USER_ROLE.superAdmin, ENUM_USER_ROLE.admin),
    validateRequestZod(
      z.object({
        body: z.object({
          password: z.string({ required_error: 'Password is required' }),
        }),
      }),
    ),
    AdminController.deleteAdmin,
  );

export const adminRoutes = router;
