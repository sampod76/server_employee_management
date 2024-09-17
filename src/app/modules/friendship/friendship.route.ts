import express from 'express';

import authMiddleware from '../../middlewares/authMiddleware';

import { ENUM_USER_ROLE } from '../../../global/enums/users';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { FriendShipsController } from './friendship.controller';
import { friendshipValidation } from './friendship.validation';
const router = express.Router();
// v1 -->https://www.notion.so/sampod/multer-file-uploade-image-upload-base64-335f1437b52f46b2b42bfb2028aaaa10?pvs=4#d36877b321fc426f8fca0004433a7a96
router
  .route('/')
  .get(
    authMiddleware(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.SELLER,
      ENUM_USER_ROLE.BUYER,
    ),
    FriendShipsController.getAllFriendShips,
  )
  .post(
    authMiddleware(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.SELLER,
      ENUM_USER_ROLE.BUYER,
    ),

    validateRequestZod(friendshipValidation.createfriendshipZodSchema),
    FriendShipsController.createFriendShip,
  );

router
  .route('/block/:id')
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.SELLER,
      ENUM_USER_ROLE.BUYER,
    ),
    validateRequestZod(friendshipValidation.friendshipBlockZodSchema),
    FriendShipsController.updateFriendShipBlock,
  );

router
  .route('/:id')
  .get(FriendShipsController.getFriendShipById)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.SELLER,
      ENUM_USER_ROLE.BUYER,
    ),
    validateRequestZod(friendshipValidation.updatefriendshipZodSchema),
    FriendShipsController.updateFriendShip,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.SUPER_ADMIN,
      ENUM_USER_ROLE.SELLER,
      ENUM_USER_ROLE.BUYER,
    ),
    FriendShipsController.deleteFriendShip,
  );

export const FriendShipsRoute = router;
