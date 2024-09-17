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
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.SELLER,
    ENUM_USER_ROLE.BUYER,
  ),
  NotificationController.getAllNotifications,
);
router.post(
  '/create-notification',
  authMiddleware(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.SELLER,
    ENUM_USER_ROLE.BUYER,
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
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.SELLER,
      ENUM_USER_ROLE.BUYER,
    ),

    uploadAwsS3Bucket.single('image'),
    parseBodyData({}),
    NotificationController.updateNotification,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.SELLER,
      ENUM_USER_ROLE.BUYER,
    ),
    NotificationController.deleteNotification,
  );

export const NotificationRoute = router;
