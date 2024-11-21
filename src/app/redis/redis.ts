import { ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
import config from '../../config';

export const redisConnectionString: ConnectionOptions = {
  host: config.redis.host, // Provide a default value if undefined
  port: Number(config.redis.port), // Ensure port is a number and provide a default value
  //   username: config.redis.userName,
  //   password: config.redis.password,
};
export const redisClient = new Redis(config.redis.url as string);
export const pubRedis = new Redis(config.redis.url as string);
export const subRedis = new Redis(config.redis.url as string);
// export const redisConnectionString: ConnectionOptions = {
//   host: 'localhost',
//   port: 6379,
// };

/* 

export const redisClient = new Redis({
  host: config.redis.host as string,
  port: Number(config.redis.port),
});

export const pubRedis = new Redis({
  host: config.redis.host as string, //127.0.0.1
  port: Number(config.redis.port), //6379
});

export const subRedis = new Redis({
  host: config.redis.host as string,
  port: Number(config.redis.port),
});

*/

//
//
//
/* 
import { createClient } from 'redis';
import { RedisClientType } from '@redis/client';

export let redisClient: RedisClientType;

export const redisSubClientConnect = async () => {
  const redisSub = createClient();
  redisSub.on('error', err => console.log('redisSubClientConnect Error', err));
  await redisSub.connect();
  return redisSub;
};

export const client = async () => {
  redisClient = createClient();
  redisClient.on('error', err => console.log('Redis Client Error', err));
  await redisClient.connect();
  return redisClient;
};

*/
