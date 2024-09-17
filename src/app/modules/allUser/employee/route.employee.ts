import express from 'express';
import { z } from 'zod';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import authMiddleware from '../../../middlewares/authMiddleware';

import parseBodyData from '../../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../../middlewares/validateRequestZod';
import { uploadAwsS3Bucket } from '../../aws/utls.aws';
import { EmployeeUserController } from './controller.employee';
import { EmployeeUserValidation } from './validation.employee';

const router = express.Router();

router.route('/').get(EmployeeUserController.getAllEmployeeUsers);

router
  .route('/:id')
  .get(EmployeeUserController.getSingleEmployeeUser)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.employee,
    ),
    // uploadAwsS3Bucket.fields([{ name: 'profileImage', maxCount: 1 }]),
    uploadAwsS3Bucket.single('profileImage'),
    parseBodyData({}),
    validateRequestZod(EmployeeUserValidation.updateEmployeeUserZodSchema),
    EmployeeUserController.updateEmployeeUser,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.employee,
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
