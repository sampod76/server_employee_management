import express from 'express';
import { NotificationController } from './notification.controller';

import { ENUM_USER_ROLE } from '../../../global/enums/users';
import authMiddleware from '../../middlewares/authMiddleware';

import parseBodyData from '../../middlewares/utils/parseBodyData';
import { uploadAwsS3Bucket } from '../aws/utls.aws';

const router = express.Router();

router.get(
  '/',
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.superAdmin,
    ENUM_USER_ROLE.hrAdmin,
    ENUM_USER_ROLE.employee,
  ),
  NotificationController.getAllNotifications,
);
router.post(
  '/create-notification',
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.superAdmin,
    ENUM_USER_ROLE.hrAdmin,
    ENUM_USER_ROLE.employee,
  ),

  uploadAwsS3Bucket.single('image'),
  parseBodyData({}),
  NotificationController.createNotification,
);
router
  .route('/:id')
  .get(NotificationController.getSingleNotification)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),

    uploadAwsS3Bucket.single('image'),
    parseBodyData({}),
    NotificationController.updateNotification,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    NotificationController.deleteNotification,
  );

export const NotificationRoute = router;
