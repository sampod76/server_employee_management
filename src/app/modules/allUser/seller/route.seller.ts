import express from 'express';
import { z } from 'zod';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import authMiddleware from '../../../middlewares/authMiddleware';

import parseBodyData from '../../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../../middlewares/validateRequestZod';
import { uploadAwsS3Bucket } from '../../aws/utls.aws';
import { SellerController } from './controller.seller';
import { SellerValidation } from './validation.seller';

const router = express.Router();

router.route('/').get(SellerController.getAllSellers);

router
  .route('/:id')
  .get(SellerController.getSingleSeller)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SELLER,
    ),

    // uploadAwsS3Bucket.fields([{ name: 'profileImage', maxCount: 1 }]),
    uploadAwsS3Bucket.single('profileImage'),
    parseBodyData({}),
    validateRequestZod(SellerValidation.updateSellerZodSchema),
    SellerController.updateSeller,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SELLER,
    ),
    validateRequestZod(
      z.object({
        body: z.object({
          password: z.string().optional(),
        }),
      }),
    ),
    SellerController.deleteSeller,
  );

export const SellerRoutes = router;
