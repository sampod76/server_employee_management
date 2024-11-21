import express from 'express';

import authMiddleware from '../../../middlewares/authMiddleware';

import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import validateRequestZod from '../../../middlewares/validateRequestZod';
import { FriendShipsController } from './friendship.controller';
import { friendshipValidation } from './friendship.validation';
const router = express.Router();
// v1 -->https://www.notion.so/sampod/multer-file-uploade-image-upload-base64-335f1437b52f46b2b42bfb2028aaaa10?pvs=4#d36877b321fc426f8fca0004433a7a96
router
  .route('/')
  .get(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    FriendShipsController.getAllFriendShips,
  )
  .post(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),

    validateRequestZod(friendshipValidation.createfriendshipZodSchema),
    FriendShipsController.createFriendShip,
  );

router.route('/check-userid-to-exist-friendship/:id').get(
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.superAdmin,
    ENUM_USER_ROLE.hrAdmin,
    ENUM_USER_ROLE.employee,
  ),

  FriendShipsController.checkUserIdToExistFriendShip,
);

router
  .route('/list-sort/:id')
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    validateRequestZod(friendshipValidation.friendshipListSortDataZodSchema),
    FriendShipsController.updateFriendShipListSort,
  );
router
  .route('/block/:id')
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    validateRequestZod(friendshipValidation.friendshipBlockZodSchema),
    FriendShipsController.updateFriendShipBlock,
  );

router
  .route('/:id')
  .get(FriendShipsController.getFriendShipById)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    validateRequestZod(friendshipValidation.updatefriendshipZodSchema),
    FriendShipsController.updateFriendShip,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    FriendShipsController.deleteFriendShip,
  );

export const FriendShipsRoute = router;
