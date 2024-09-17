import express, { NextFunction, Request, Response } from 'express';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import authMiddleware from '../../middlewares/authMiddleware';

import { uploadAwsS3Bucket } from '../aws/utls.aws';
import { AllTextFieldController } from './constroller.AllTextField';
import { AllTextFieldValidation } from './validation.AllTextField';
import parseBodyData from '../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../middlewares/validateRequestZod';

const router = express.Router();

router
  .route('/')
  // This route is open
  .get(AllTextFieldController.getAllAllTextField)
  .post(
    authMiddleware(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),

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
    authMiddleware(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),

    uploadAwsS3Bucket.single('image'),
    parseBodyData({}),
    validateRequestZod(AllTextFieldValidation.updateAllTextFieldZodSchema),
    AllTextFieldController.updateAllTextField,
  )
  .delete(
    authMiddleware(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    AllTextFieldController.deleteAllTextField,
  );

export const AllTextFieldRoute = router;
