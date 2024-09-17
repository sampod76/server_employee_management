import { NextFunction, Request, Response } from 'express';

import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import { jwtHelpers } from '../../helper/jwtHelpers';
import ApiError from '../errors/ApiError';
import { validateUserInDatabase } from '../modules/allUser/user/user.utils';

const authMiddleware =
  (...requiredRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //get authorization token
      let verifiedUser = null;
      const token = req.headers.authorization;

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
      }

      // verify token only general user

      try {
        if (token) {
          verifiedUser = jwtHelpers.verifyToken(
            token,
            config.jwt.secret as Secret,
          );

          req.user = verifiedUser;
        }
      } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
      }

      // role diye guard korar jnno
      if (requiredRoles.length && !requiredRoles.includes(verifiedUser?.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'forbidden access');
      }
      //--validation in database or raids--
      const user = await validateUserInDatabase([verifiedUser?.userId]);
      req.user = {
        ...req.user,
        details: user[0],
      };

      next();
    } catch (error) {
      next(error);
    }
  };

export default authMiddleware;
