import express from 'express';
import { z } from 'zod';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import authMiddleware from '../../../middlewares/authMiddleware';

import { uploadImage } from '../../../middlewares/uploader.multer';
import parseBodyData from '../../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../../middlewares/validateRequestZod';
import { EmployeeUserController } from './controller.employee';
import { EmployeeUserValidation } from './validation.employee';

const router = express.Router();

router
  .route('/')
  .get(
    authMiddleware(
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.employee,
      ENUM_USER_ROLE.hrAdmin,
    ),
    EmployeeUserController.getAllEmployeeUsers,
  );
router.route('/dashboard').get(
  authMiddleware(
    // ENUM_USER_ROLE.superAdmin,
    // ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.employee,
    // ENUM_USER_ROLE.hrAdmin,
  ),
  EmployeeUserController.dashboard,
);
router
  .route('/:id')
  .get(
    authMiddleware(
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.employee,
      ENUM_USER_ROLE.hrAdmin,
    ),
    EmployeeUserController.getSingleEmployeeUser,
  )
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.employee,
      ENUM_USER_ROLE.hrAdmin,
    ),
    // uploadAwsS3Bucket.fields([{ name: 'profileImage', maxCount: 1 }]),
    uploadImage.single('profileImage'),
    parseBodyData({}),
    validateRequestZod(EmployeeUserValidation.updateEmployeeUserZodSchema),
    EmployeeUserController.updateEmployeeUser,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.employee,
      ENUM_USER_ROLE.hrAdmin,
    ),
    validateRequestZod(
      z.object({
        body: z.object({
          password: z.string().optional(),
        }),
      }),
    ),
    EmployeeUserController.deleteEmployeeUser,
  );

export const EmployeeUserRoutes = router;
