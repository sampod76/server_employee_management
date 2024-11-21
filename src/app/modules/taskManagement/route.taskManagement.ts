import express from 'express';

import authMiddleware from '../../middlewares/authMiddleware';

import { z } from 'zod';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { uploadImage } from '../../middlewares/uploader.multer';
import parseBodyData from '../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { TaskManagementController } from './controller.taskManagement';
import { TaskManagementValidation } from './validation.taskManagement';
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
    // uploadAwsS3Bucket.array('submitDocuments'),
    uploadImage.array('submitDocuments'),
    parseBodyData({}),
    validateRequestZod(TaskManagementValidation.createTaskManagementZodSchema),
    TaskManagementController.createTaskManagement,
  );

router.route('/submit-task/:id').patch(
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.superAdmin,
    ENUM_USER_ROLE.hrAdmin,
    ENUM_USER_ROLE.employee,
  ),
  // uploadAwsS3Bucket.array('submitDocuments'),
  uploadImage.array('submitDocuments'),
  parseBodyData({}),
  validateRequestZod(
    z.object({
      body: TaskManagementValidation.TaskManagement_UpdateBodyDate.merge(
        TaskManagementValidation.TaskManagement_BodyData.pick({
          taskProgressStatus: true,
        }),
      ),
    }),
  ),
  TaskManagementController.updateTaskProgress,
);

router
  .route('/:id')
  .get(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    TaskManagementController.getTaskManagementById,
  )
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    // uploadAwsS3Bucket.array('submitDocuments'),
    uploadImage.array('submitDocuments'),
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
