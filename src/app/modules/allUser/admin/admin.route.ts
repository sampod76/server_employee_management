import express from 'express';
import { z } from 'zod';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import authMiddleware from '../../../middlewares/authMiddleware';
import parseBodyData from '../../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../../middlewares/validateRequestZod';
import { uploadAwsS3Bucket } from '../../aws/utls.aws';
import { AdminController } from './admin.controller';
import { AdminValidation } from './admin.validation';

const router = express.Router();

router
  .route('/')
  .get(
    authMiddleware(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
    AdminController.getAllAdmins,
  );

router
  .route('/:id')
  .get(
    authMiddleware(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
    AdminController.getSingleAdmin,
  )
  .patch(
    authMiddleware(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
    // uploadAwsS3Bucket.fields([{ name: 'profileImage', maxCount: 1 }]),
    uploadAwsS3Bucket.single('profileImage'),
    parseBodyData({}),
    validateRequestZod(AdminValidation.updateAdminZodSchema),
    AdminController.updateAdmin,
  )
  .delete(
    authMiddleware(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
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
