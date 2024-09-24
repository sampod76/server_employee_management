import express from 'express';

import authMiddleware from '../../middlewares/authMiddleware';

import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { uploadImage } from '../../middlewares/uploader.multer';
import parseBodyData from '../../middlewares/utils/parseBodyData';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { ProjectController } from './controller.project';
import { ProjectValidation } from './validation.project';
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

    ProjectController.getAllProjects,
  )
  .post(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    // uploadAwsS3Bucket.single('logo'),
    uploadImage.single('logo'),
    parseBodyData({}),
    validateRequestZod(ProjectValidation.createProjectZodSchema),
    ProjectController.createProject,
  );

router
  .route('/:id')
  .get(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    ProjectController.getProjectById,
  )
  .patch(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
    ),
    uploadImage.single('logo'),
    parseBodyData({}),
    validateRequestZod(ProjectValidation.updateProjectZodSchema),
    ProjectController.updateProject,
  )
  .delete(
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.superAdmin,
      ENUM_USER_ROLE.hrAdmin,
    ),
    ProjectController.deleteProject,
  );

export const ProjectRoute = router;
