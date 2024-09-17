import express from 'express';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import authMiddleware from '../../middlewares/authMiddleware';

import parseBodyData from '../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { uploadAwsS3Bucket } from '../aws/utls.aws';
import { AllTextFieldController } from './constroller.AllTextField';
import { AllTextFieldValidation } from './validation.AllTextField';

const router = express.Router();

router
  .route('/')
  // This route is open
  .get(AllTextFieldController.getAllAllTextField)
  .post(
    authMiddleware(ENUM_USER_ROLE.admin, ENUM_USER_ROLE.superAdmin),

    uploadAwsS3Bucket.single('image'),
    parseBodyData({}),
    validateRequestZod(AllTextFieldValidation.createAllTextFieldZodSchema),
    AllTextFieldController.createAllTextField,
  );

router
  .route('/:id')
  // This route is open
  .get(AllTextFieldController.getSingleAllTextField)
  .patch(
    authMiddleware(ENUM_USER_ROLE.admin, ENUM_USER_ROLE.superAdmin),

    uploadAwsS3Bucket.single('image'),
    parseBodyData({}),
    validateRequestZod(AllTextFieldValidation.updateAllTextFieldZodSchema),
    AllTextFieldController.updateAllTextField,
  )
  .delete(
    authMiddleware(ENUM_USER_ROLE.admin, ENUM_USER_ROLE.superAdmin),
    AllTextFieldController.deleteAllTextField,
  );

export const AllTextFieldRoute = router;
