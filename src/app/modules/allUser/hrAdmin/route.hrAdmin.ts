import express from 'express';
import { z } from 'zod';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import authMiddleware from '../../../middlewares/authMiddleware';

import { uploadImage } from '../../../middlewares/uploader.multer';
import parseBodyData from '../../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../../middlewares/validateRequestZod';
import { HrAdminController } from './controller.hrAdmin';
import { HrAdminValidation } from './validation.hrAdmin';

const router = express.Router();

router.route('/').get(HrAdminController.getAllHrAdmins);

router
  .route('/:id')
  .get(HrAdminController.getSingleHrAdmin)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.hrAdmin,
    ),

    // uploadAwsS3Bucket.fields([{ name: 'profileImage', maxCount: 1 }]),
    // uploadAwsS3Bucket.single('profileImage'),
    uploadImage.single('profileImage'),
    parseBodyData({}),
    validateRequestZod(HrAdminValidation.updateHrAdminZodSchema),
    HrAdminController.updateHrAdmin,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.hrAdmin,
    ),
    validateRequestZod(
      z.object({
        body: z.object({
          password: z.string().optional(),
        }),
      }),
    ),
    HrAdminController.deleteHrAdmin,
  );

export const HrAdminRoutes = router;
