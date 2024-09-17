import express from 'express';
import { z } from 'zod';
import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import authMiddleware from '../../../middlewares/authMiddleware';
import validateRequestZod from '../../../middlewares/validateRequestZod';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = express.Router();

router.route('/').get(UserController.getAllUsers).post(
  // uploadAwsS3Bucket.single('profileImage'),
  // parseBodyData({}),
  validateRequestZod(UserValidation.createUserZodSchema),
  UserController.createUser,
);

router.route('/isOnline/:userid').get(UserController.isOnline);
router
  .route('/author-to-create') // create user by this ruler
  .post(
    authMiddleware(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
    // uploadAwsS3Bucket.single('profileImage'),
    // parseBodyData({}),
    validateRequestZod(UserValidation.createUserZodSchema),
    UserController.createUser,
  );

router
  .route('/temp-user')
  .post(
    validateRequestZod(UserValidation.tempUser),
    UserController.createUserTempUser,
  );

router
  .route('/:id')
  .get(UserController.getSingleUser)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.BUYER,
      ENUM_USER_ROLE.SELLER,
    ),
    validateRequestZod(UserValidation.updateUserZodSchema),
    UserController.updateUser,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.BUYER,
      ENUM_USER_ROLE.SELLER,
    ),
    validateRequestZod(
      z.object({
        body: z.object({
          password: z.string().optional(),
        }),
      }),
    ),
    UserController.deleteUser,
  );

export const userRoutes = router;