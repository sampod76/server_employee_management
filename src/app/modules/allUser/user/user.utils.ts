/* eslint-disable @typescript-eslint/ban-ts-comment */
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { ENUM_STATUS } from '../../../../global/enum_constant_type';
import ApiError from '../../../errors/ApiError';
import { ENUM_REDIS_KEY } from '../../../redis/consent.redis';
import { redisClient } from '../../../redis/redis';
import { IRedisSetter, redisSetter } from '../../../redis/utls.redis';
import { IUserRef } from '../typesAndConst';
import { IUser } from './user.interface';
import { User } from './user.model';

export const findLastUserId = async () => {
  const lastUser = await User.findOne({}, { userUniqueId: 1, _id: 0 })
    .sort({
      createdAt: -1,
    })
    .lean();
  return lastUser?.userUniqueId;
};

export const generateUserId = async () => {
  const currentId = (await findLastUserId()) || (0).toString().padStart(8, '0');
  const slice = currentId.includes('-') ? currentId.split('-')[1] : currentId;
  // increment by 1
  const incrementedId = (parseInt(slice) + 1).toString().padStart(8, '0');

  return incrementedId;
};
//*********Redis ** functionality************ */
export const findUserInRedisByUserId = async (id: string | Types.ObjectId) => {
  const getUser = await redisClient.get(
    ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_USERS + id.toString(),
  );
  if (getUser) {
    return JSON.parse(getUser) as IUser;
  } else {
    return null;
  }
};
export const setUserInRedisByUserId = async (id: string, data: IUser) => {
  const getUser = await redisClient.set(
    ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_USERS + id.toString(),
    JSON.stringify(data),
    'EX',
    24 * 60 * 60, // 1 day to second
  );
  return getUser;
};
//********Redis **functionality end */

export const validateUserInDbOrRedis = async (users: string[] | IUserRef[]) => {
  let findUserData: IUser[];
  if (typeof users[0] === 'string' || users[0] instanceof Types.ObjectId) {
    // Handle the case when `users` is an array of strings (user IDs)
    const findInRedisUsers = await redisClient.mget(
      users.map(
        user => ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_USERS + user.toString(),
      ),
    ); //? output [null] // when any key not found then send null
    const findRedis = findInRedisUsers.filter(user => Boolean(user));
    //! not found in redis -- get database
    if (!findRedis.length) {
      findUserData = await User.find({
        _id: {
          $in: users.map(
            userId => new Types.ObjectId(userId.toString() as string),
          ),
        },
      });

      if (findUserData.length) {
        /* // Prepare the key value pairs for mset
        const redisUsersData: string[] = findUserData.reduce(
          (acc: string[], user) => {
            acc.push(
              ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_USERS + user._id.toString(),
              JSON.stringify(user),
            );
            return acc;
          },
          [],
        );
        await redisClient.mset('key1','value1','key2','value2','key3','value3');
        await redisClient.mset(...redisUsersData);

        */
        /* //----second condition---
        for (const user of findUserData) {
          await redisClient.set(
            user._id,
            JSON.stringify(user),
            'EX',
            24 * 60 * 60,
          ); // 1 day to second
        } 
          */
        if (findUserData?.length) {
          const setter = findUserData?.map(data => {
            // some time data is [null] then validate
            return {
              key: data?._id,
              value: data,
              ttl: 24 * 60 * 60, // 1 day to second
            };
          }) as unknown as IRedisSetter<IUser>;

          await redisSetter<IUser>(setter);
        }
      }
    }
    //! found in redis in data
    else {
      findUserData = findRedis.map(user => {
        if (user) {
          return JSON.parse(user);
        } else {
          return null;
        }
      });
    }

    validateUsers(findUserData);
  } else if (
    typeof users[0] === 'object' &&
    users[0] !== null &&
    'userId' in users[0]
  ) {
    const findInRedisUsers = await redisClient.mget(
      users.map(
        (user: any) =>
          ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_USERS + user?.userId?.toString(),
      ),
    ); //
    const findRedis = findInRedisUsers.filter(user => Boolean(user));
    //! not found in redis -- get database
    if (!findRedis.length) {
      // Handle the case when `users` is an array of IUserRef
      findUserData = await User.find({
        _id: {
          //@ts-ignore
          $in: users.map(
            //@ts-ignore
            user => new Types.ObjectId(user?.userId?.toString() as string),
          ),
        },
      });
      if (findUserData.length) {
        //? get database to data then set redis
        /* // Prepare the key value pairs for mset
        const redisUsersData: string[] = findUserData.reduce(
          (acc: string[], user) => {
            acc.push(
              ENUM_REDIS_KEY.REDIS_IN_SAVE_ALL_USERS + user._id.toString(),
              JSON.stringify(user),
            );
            return acc;
          },
          [],
        );
        await redisClient.mset('key1','value1','key2','value2','key3','value3');
        await redisClient.mset(...redisUsersData);

        */
        /*
         for (const user of findUserData) {
          await redisClient.set(
            user._id,
            JSON.stringify(user),
            'EX',
            24 * 60 * 60,
          ); // 1 day to second
        } 
          */
        if (findUserData?.length) {
          const setter = findUserData?.map(data => {
            // some time data is [null] then validate
            return {
              key: data?._id,
              value: data,
              ttl: 24 * 60 * 60, // 1 day to second
            };
          }) as unknown as IRedisSetter<IUser>;

          await redisSetter<IUser>(setter);
        }
      }
    }
    //! found in redis
    else {
      findUserData = findRedis.map(user => {
        if (user) {
          return JSON.parse(user);
        } else {
          return null;
        }
      });
    }
    validateUsers(findUserData);
  } else {
    throw new Error(
      'Invalid input: users array must contain either strings or IUserRef objects',
    );
  }
  return findUserData;
};

const validateUsers = (users: IUser[]) => {
  users.forEach(item => {
    if (item && item.isDelete === true) {
      throw new ApiError(httpStatus.NOT_FOUND, `${item.role} User is deleted`);
    } else if (item && item.status === ENUM_STATUS.INACTIVE) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        `${item.role} User is deactivated`,
      );
    } else if (item && item.status === ENUM_STATUS.BLOCK) {
      throw new ApiError(httpStatus.NOT_FOUND, `${item.role} User is blocked`);
    }
    // else if (item && item.verify !== ENUM_VERIFY.ACCEPT) {
    //   throw new ApiError(httpStatus.FORBIDDEN, `User is ${item.verify} state`);
    // }
  });
};

export const RequestToRefUserObject = (user: IUserRef): IUserRef => {
  const userObject: IUserRef = {
    userId: user?.userId,
    role: user?.role,
    roleBaseUserId: user?.roleBaseUserId,
  };
  return userObject;
};
