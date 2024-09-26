import express from 'express';

import authMiddleware from '../../middlewares/authMiddleware';

import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { uploadImage } from '../../middlewares/uploader.multer';
import parseBodyData from '../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { CheckInOutController } from './controller.checkInOut';
import { CheckInOutValidation } from './validation.checkInOut';
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
    CheckInOutController.getAllCheckInOuts,
  );
router.route('/check-in-ou-admin').post(
  authMiddleware(ENUM_USER_ROLE.admin, ENUM_USER_ROLE.superAdmin),
  // uploadAwsS3Bucket.array('provide'),
  uploadImage.array('provide'),
  parseBodyData({}),
  validateRequestZod(CheckInOutValidation.createAdminByCheckInOutZodSchema),
  CheckInOutController.createAdminByCheckInOut,
);

router.route('/check-in').post(
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.superAdmin,
    ENUM_USER_ROLE.hrAdmin,
    ENUM_USER_ROLE.employee,
  ),
  // uploadAwsS3Bucket.array('provide'),
  uploadImage.array('provide'),
  parseBodyData({}),
  validateRequestZod(CheckInOutValidation.createCheckInOutZodSchema),
  CheckInOutController.createCheckIn,
);
router.route('/check-out').post(
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.superAdmin,
    ENUM_USER_ROLE.hrAdmin,
    ENUM_USER_ROLE.employee,
  ),
  // uploadAwsS3Bucket.array('provide'),
  uploadImage.array('provide'),
  parseBodyData({}),
  validateRequestZod(CheckInOutValidation.createCheckInOutZodSchema),
  CheckInOutController.createCheckOut,
);

router
  .route('/:id')
  .get(CheckInOutController.getCheckInOutById)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      // ENUM_USER_ROLE.employee,
    ),
    // uploadAwsS3Bucket.array('provide'),
    uploadImage.array('provide'),
    parseBodyData({}),
    validateRequestZod(CheckInOutValidation.updateCheckInOutZodSchema),
    CheckInOutController.updateCheckInOut,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      // ENUM_USER_ROLE.employee,
    ),
    CheckInOutController.deleteCheckInOut,
  );

export const CheckInOutRoute = router;
