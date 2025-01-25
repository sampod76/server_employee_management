import express from 'express';

import authMiddleware from '../../../middlewares/authMiddleware';

import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import parseBodyData from '../../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../../middlewares/validateRequestZod';

import { GroupssController } from './controller.groups';
import { GroupsValidation } from './validation.groups';
import { uploadImage } from '../../../middlewares/uploader.multer';
const router = express.Router();

router
  .route('/')
  .get(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    GroupssController.getAllGroupss,
  )
  .post(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    uploadImage.fields([
      { name: 'profileImage', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
    ]),
    parseBodyData({}),
    validateRequestZod(GroupsValidation.createGroupsZodSchema),
    GroupssController.createGroups,
  );

router.route('/check-userid-to-exist-groups/:id').get(
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.superAdmin,
    ENUM_USER_ROLE.hrAdmin,
    ENUM_USER_ROLE.employee,
  ),

  GroupssController.checkUserIdToExistGroups,
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
    validateRequestZod(GroupsValidation.GroupsListSortDataZodSchema),
    GroupssController.updateGroupsListSort,
  );

router
  .route('/:id')
  .get(GroupssController.getGroupsById)
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    validateRequestZod(GroupsValidation.updateGroupsZodSchema),
    GroupssController.updateGroups,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    GroupssController.deleteGroups,
  );

export const GroupssRoute = router;
