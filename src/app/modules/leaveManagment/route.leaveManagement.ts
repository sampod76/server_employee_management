import express from 'express';

import authMiddleware from '../../middlewares/authMiddleware';

import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { uploadFile } from '../../middlewares/uploader.multer';
import parseBodyData from '../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { LeaveManagementController } from './controller.leaveManagement';
import { LeaveManagementValidation } from './validation.leaveManagement';
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
    LeaveManagementController.getAllLeaveManagements,
  )
  .post(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    // uploadAwsS3Bucket.array('provide'),
    uploadFile.array('provide'),
    parseBodyData({}),
    validateRequestZod(
      LeaveManagementValidation.createLeaveManagementZodSchema,
    ),
    LeaveManagementController.createLeaveManagement,
  );

router.route('/approved-or-declined/:id').patch(
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.superAdmin,
    ENUM_USER_ROLE.hrAdmin,
    // ENUM_USER_ROLE.employee,
  ),
  LeaveManagementController.approvedDeclinedlLeaveManagement,
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
    LeaveManagementController.getLeaveManagementById,
  )
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    // uploadAwsS3Bucket.array('provide'),
    uploadFile.array('provide'),
    parseBodyData({}),
    validateRequestZod(
      LeaveManagementValidation.updateLeaveManagementZodSchema,
    ),
    LeaveManagementController.updateLeaveManagement,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    LeaveManagementController.deleteLeaveManagement,
  );

export const LeaveManagementRoute = router;
