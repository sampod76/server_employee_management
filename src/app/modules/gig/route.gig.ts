import express from 'express';

import authMiddleware from '../../middlewares/authMiddleware';

import { ENUM_USER_ROLE } from '../../../global/enums/users';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { GigsController } from './controller.gig';
import { GigValidation } from './validation.gig';
const router = express.Router();

router.route('/').get(GigsController.getAllGigs).post(
  authMiddleware(
    // ENUM_USER_ROLE.admin,
    // ENUM_USER_ROLE.superAdmin,
    ENUM_USER_ROLE.hrAdmin,
  ),

  // uploadAwsS3Bucket.single('image'),
  // parseBodyData({ required_file_fields: ['image'] }),
  validateRequestZod(GigValidation.createGigZodSchema),
  GigsController.createGig,
);

router
  .route('/:id')
  .get(GigsController.getGigById)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
    ),
    // uploadAwsS3Bucket.single('image'),
    // parseBodyData({}),
    validateRequestZod(GigValidation.updateGigZodSchema),
    GigsController.updateGig,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
    ),
    GigsController.deleteGig,
  );

export const GigsRoute = router;
