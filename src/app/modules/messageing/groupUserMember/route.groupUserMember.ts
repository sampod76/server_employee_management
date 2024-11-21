import express from 'express';

import authMiddleware from '../../../middlewares/authMiddleware';

import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import validateRequestZod from '../../../middlewares/validateRequestZod';
import { GroupMembersController } from './controller.groupUserMember';
import { GroupMemberValidation } from './validation.groupUserMember';
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
    GroupMembersController.getAllGroupMembers,
  )
  .post(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),

    validateRequestZod(GroupMemberValidation.createGroupMemberZodSchema),
    GroupMembersController.createGroupMember,
  );

router.route('/check-userid-to-exist-GroupMember/:id').get(
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.superAdmin,
    ENUM_USER_ROLE.hrAdmin,
    ENUM_USER_ROLE.employee,
  ),

  GroupMembersController.checkUserIdToExistGroupMember,
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
    validateRequestZod(GroupMemberValidation.GroupMemberListSortDataZodSchema),
    GroupMembersController.updateGroupMemberListSort,
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
    validateRequestZod(GroupMemberValidation.GroupMemberBlockZodSchema),
    GroupMembersController.updateGroupMemberBlock,
  );

router
  .route('/:id')
  .get(GroupMembersController.getGroupMemberById)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    validateRequestZod(GroupMemberValidation.updateGroupMemberZodSchema),
    GroupMembersController.updateGroupMember,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    GroupMembersController.deleteGroupMember,
  );

export const GroupMembersRoute = router;
