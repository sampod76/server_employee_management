import express from 'express';

import authMiddleware from '../../middlewares/authMiddleware';

import { ENUM_USER_ROLE } from '../../../global/enums/users';
import parseBodyData from '../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { uploadAwsS3Bucket } from '../aws/utls.aws';
import { TaskManagementController } from './controller.checkInOut';
import { TaskManagementValidation } from './validation.checkInOut';
const router = express.Router();

router
  .route('/')
  .get(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    TaskManagementController.getAllTaskManagements,
  )
  .post(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    uploadAwsS3Bucket.array('submitDocuments'),
    parseBodyData({}),
    validateRequestZod(TaskManagementValidation.createTaskManagementZodSchema),
    TaskManagementController.createTaskManagement,
  );

router
  .route('/:id')
  .get(TaskManagementController.getTaskManagementById)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    uploadAwsS3Bucket.array('submitDocuments'),
    parseBodyData({}),
    validateRequestZod(TaskManagementValidation.updateTaskManagementZodSchema),
    TaskManagementController.updateTaskManagement,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    TaskManagementController.deleteTaskManagement,
  );

export const TaskManagementRoute = router;
