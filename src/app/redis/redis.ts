import { ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
import config from '../../config';
import { logger } from '../share/logger';
export const redisConnectionString: ConnectionOptions = {
  host: config.redis.host || 'localhost', // Provide a default value if undefined
  port: Number(config.redis.port) || 6379, // Ensure port is a number and provide a default value
  //   username: config.redis.userName,
  //   password: config.redis.password,
};

/**
 * Description: This function does something important.
 *
 * @param {type} ReusingRedisClient  - //? For normal Redis operations (GET, SET, etc.), it's fine to reuse a single Redis client across services or modules.
 * @param {type} NotReusing_Pub_Sub - //!Use separate clients for Pub/Sub: Always use dedicated Redis clients for publishing and subscribing. It's common to have one client for pubRedis (publishing) and another for subRedis (subscribing), ensuring that you don't run into connection blocking issues.
 *
 * @returns {type} Description of the return value.
 */

export const redisClient = new Redis(config.redis.url as string);
export const pubRedis = new Redis(config.redis.url as string);
export const subRedis = new Redis(config.redis.url as string);

// let initialRedisClient: Redis;
// export const redisClient = () => {
//   if (initialRedisClient) {
//     return initialRedisClient;
//   } else {
//     initialRedisClient = new Redis(config.redis.url as string);
//     initialRedisClient.on('error', err => logger.error(err));
//     // initialRedisClient.connect();
//     return initialRedisClient;
//   }
// };
