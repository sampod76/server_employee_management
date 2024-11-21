import express from 'express';

import { ENUM_USER_ROLE } from '../../../../global/enums/users';
import authMiddleware from '../../../middlewares/authMiddleware';
import { ChatMessagesController } from './messages.controller';

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
    ChatMessagesController.getAllChatMessages,
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
    ChatMessagesController.getChatMessageById,
  );
// .delete(
//   authMiddleware(
//     ENUM_USER_ROLE.admin,
//     ENUM_USER_ROLE.superAdmin,
//     ENUM_USER_ROLE.hrAdmin,
//   ),
//   ChatMessagesController.deleteChatMessage,
// );

export const ChatMessageRoute = router;
