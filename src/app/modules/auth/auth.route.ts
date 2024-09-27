import express from 'express';

import { ENUM_USER_ROLE } from '../../../global/enums/users';
import { apiLimiter } from '../../middlewares/api-limited-hite';
import authMiddleware from '../../middlewares/authMiddleware';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = express.Router();

router.post(
  '/login',
  apiLimiter(10, 30),
  validateRequestZod(AuthValidation.loginZodSchema),
  AuthController.loginUser,
);
router.post(
  '/log-out-history/:id', // id --> login history _id
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.hrAdmin,
    ENUM_USER_ROLE.employee,
    ENUM_USER_ROLE.superAdmin,
  ),
  // validateRequestZod(AuthValidation.refreshTokenZodSchema),
  AuthController.logOut,
);

router.post(
  '/refresh-token',
  validateRequestZod(AuthValidation.refreshTokenZodSchema),
  AuthController.refreshToken,
);
router.post(
  '/send-mail',
  authMiddleware(ENUM_USER_ROLE.superAdmin, ENUM_USER_ROLE.admin),
  // validateRequestZod(AuthValidation.refreshTokenZodSchema),
  AuthController.sendMailAuth,
);

router.post(
  '/change-password',
  apiLimiter(10, 30),
  validateRequestZod(AuthValidation.changePasswordZodSchema),
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.hrAdmin,
    ENUM_USER_ROLE.employee,
    ENUM_USER_ROLE.superAdmin,
  ),

  AuthController.changePassword,
);

router.get(
  '/profile',
  authMiddleware(
    ENUM_USER_ROLE.admin,
    ENUM_USER_ROLE.hrAdmin,
    ENUM_USER_ROLE.employee,
    ENUM_USER_ROLE.superAdmin,
  ),
  AuthController.profile,
);

//---Forget password ----
router.post(
  '/forgot-password',
  apiLimiter(10, 30),
  validateRequestZod(AuthValidation.forgotPassword),
  AuthController.forgotPass,
);
router.post(
  '/set-otp',
  apiLimiter(10, 30),
  validateRequestZod(AuthValidation.checkOtp),
  AuthController.checkOtp,
);
router.post(
  '/token-to-set-password',
  apiLimiter(10, 30),
  validateRequestZod(AuthValidation.tokenToSetPassword),
  AuthController.tokenToSetPassword,
);
//---

router
  .route('/2fa')
  .post(
    apiLimiter(10, 30),
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
      ENUM_USER_ROLE.superAdmin,
    ),
    AuthController.enableTwoFactorAuth,
  );
router
  .route('/2fa/verify')
  .post(
    apiLimiter(10, 30),
    authMiddleware(
      ENUM_USER_ROLE.admin,
      ENUM_USER_ROLE.hrAdmin,
      ENUM_USER_ROLE.employee,
      ENUM_USER_ROLE.superAdmin,
    ),
    AuthController.verifyTwoFactorAuth,
  );

export const AuthRoutes = router;
