import express from 'express';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import authMiddleware from '../../middlewares/authMiddleware';

import parseBodyData from '../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { uploadAwsS3Bucket } from '../aws/utls.aws';
import { CategoryController } from './constroller.category';
import { CategoryValidation } from './validation.category';

const router = express.Router();

router
  .route('/')
  // This route is open
  .get(CategoryController.getAllCategory)
  .post(
    authMiddleware(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    uploadAwsS3Bucket.single('image'),
    parseBodyData({}),
    validateRequestZod(CategoryValidation.createCategoryZodSchema),

    CategoryController.createCategory,
  );

router
  .route('/:id')
  // This route is open
  .get(CategoryController.getSingleCategory)
  .patch(
    authMiddleware(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),

    uploadAwsS3Bucket.single('image'),
    validateRequestZod(CategoryValidation.updateCategoryZodSchema),

    CategoryController.updateCategory,
  )
  .delete(
    authMiddleware(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    CategoryController.deleteCategory,
  );

export const CategoryRoute = router;
