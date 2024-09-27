import express from 'express';
import { ENUM_USER_ROLE } from '../../../global/enums/users';
import authMiddleware from '../../middlewares/authMiddleware';

import { uploadImage } from '../../middlewares/uploader.multer';
import parseBodyData from '../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../middlewares/validateRequestZod';
// import { uploadAwsS3Bucket } from '../aws/utls.aws';
import { CategoryController } from './constroller.category';
import { CategoryValidation } from './validation.category';

const router = express.Router();

router
  .route('/')
  // This route is open
  .get(CategoryController.getAllCategory)
  .post(
    authMiddleware(ENUM_USER_ROLE.admin, ENUM_USER_ROLE.superAdmin),
    // uploadAwsS3Bucket.single('image'),
    uploadImage.single('image'),
    parseBodyData({}),
    validateRequestZod(CategoryValidation.createCategoryZodSchema),
    CategoryController.createCategory,
  );

router
  .route('/:id')
  // This route is open
  .get(CategoryController.getSingleCategory)
  .patch(
    authMiddleware(ENUM_USER_ROLE.admin, ENUM_USER_ROLE.superAdmin),

    // uploadAwsS3Bucket.single('image'),
    uploadImage.single('image'),
    // uploadImage.single('image'),
    validateRequestZod(CategoryValidation.updateCategoryZodSchema),

    CategoryController.updateCategory,
  )
  .delete(
    authMiddleware(ENUM_USER_ROLE.admin, ENUM_USER_ROLE.superAdmin),
    CategoryController.deleteCategory,
  );

export const CategoryRoute = router;
