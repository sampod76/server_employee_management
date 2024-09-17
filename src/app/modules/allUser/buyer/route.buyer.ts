import express from 'express';
import { z } from 'zod';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import authMiddleware from '../../../middlewares/authMiddleware';

import parseBodyData from '../../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../../middlewares/validateRequestZod';
import { uploadAwsS3Bucket } from '../../aws/utls.aws';
import { BuyerUserController } from './controller.buyer';
import { BuyerUserValidation } from './validation.buyer';

const router = express.Router();

router.route('/').get(BuyerUserController.getAllBuyerUsers);

router
  .route('/:id')
  .get(BuyerUserController.getSingleBuyerUser)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.employee,
    ),
    // uploadAwsS3Bucket.fields([{ name: 'profileImage', maxCount: 1 }]),
    uploadAwsS3Bucket.single('profileImage'),
    parseBodyData({}),
    validateRequestZod(BuyerUserValidation.updateBuyerUserZodSchema),
    BuyerUserController.updateBuyerUser,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.employee,
    ),
    validateRequestZod(
      z.object({
        body: z.object({
          password: z.string().optional(),
        }),
      }),
    ),
    BuyerUserController.deleteBuyerUser,
  );

export const BuyerUserRoutes = router;
