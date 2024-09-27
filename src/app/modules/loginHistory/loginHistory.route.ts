import express from 'express';

import { UserLoginHistoryController } from './loginHistory.controller';

import { ENUM_USER_ROLE } from '../../../global/enums/users';
import authMiddleware from '../../middlewares/authMiddleware';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { UserLoginHistoryValidation } from './loginHistory.validation';
const router = express.Router();

router
  .route('/')
  .get(
    authMiddleware(
      ENUM_USER_ROLE.employee,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
    ),
    UserLoginHistoryController.getAllUserLoginHistorys,
  );

router
  .route('/:id')
  .get(
    authMiddleware(
      ENUM_USER_ROLE.employee,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
    ),
    UserLoginHistoryController.getSingleUserLoginHistory,
  )
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.employee,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
    ),
    validateRequestZod(
      UserLoginHistoryValidation.updateUserLoginHistoryZodSchema,
    ),
    UserLoginHistoryController.updateUserLoginHistory,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.employee,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
    ),
    UserLoginHistoryController.deleteUserLoginHistory,
  );

export const UserLoginHistoryRoutes = router;
