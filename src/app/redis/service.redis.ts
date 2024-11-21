/* eslint-disable @typescript-eslint/no-unused-vars */
import { ENUM_REDIS_KEY, subscribeArray } from './consent.redis';
import { redisClient, subRedis } from './redis';
import { deleteAllKeys } from './utls.redis';

export const findAllSocketsIdsFromUserId = async (userId: string) => {
  let cursor = '0';
  const getUsers: string[] = [];

  do {
    const [newCursor, keys] = await redisClient.scan(
      cursor,
      'MATCH',
      ENUM_REDIS_KEY.socket_user + userId + '*',
      'COUNT',
      50, // You can adjust this count as needed
    );
    cursor = newCursor;

    if (keys.length) {
      const socketIds = keys.map(id => id.split(':')[3]);
      getUsers.push(...socketIds);
    }
  } while (cursor !== '0');

  //console.log('🚀 ~ socket.on ~ getUsers:', getUsers);
  return getUsers;
};

export const findAllKeysScan = async (key: string) => {
  let cursor = '0';
  const getData: string[] = [];

  do {
    const [newCursor, keys] = await redisClient.scan(
      cursor,
      'MATCH',
      key + '*',
      'COUNT',
      50, // You can adjust this count as needed
    );
    cursor = newCursor;

    if (keys.length) {
      getData.push(...keys);
    }
  } while (cursor !== '0');

  //console.log('🚀 ~ socket.on ~ getData:', getData);
  return getData;
};

export const findAllDataByKeyScan = async (key: string) => {
  let cursor = '0';
  const getKeys: string[] = [];

  do {
    const [newCursor, keys] = await redisClient.scan(
      cursor,
      'MATCH',
      key + '*',
      'COUNT',
      50, // You can adjust this count as needed
    );
    cursor = newCursor;

    if (keys.length) {
      getKeys.push(...keys);
    }
  } while (cursor !== '0');

  //console.log('🚀 ~ socket.on ~ getData:', getData);
  const keys = getKeys;

  let getData: (string | null)[] = [];
  if (keys.length) {
    getData = await redisClient.mget(keys);
  }
  return getData;
};

export const findDataByUserIdAndSocketId = async (
  userId: string,
  socketId: string,
) => {
  const getUsers = await redisClient.get(
    ENUM_REDIS_KEY.socket_user + userId + ':' + socketId,
  );
  return getUsers;
};

export const RedisRunFunction = async () => {
  //------------------------redis to all old user key remove---------------
  deleteAllKeys(ENUM_REDIS_KEY.socket_user + '*')
    .then(() => {
      console.log('All Redis keys deleted');
    })
    .catch(err => {
      console.error('Error deleting keys:', err);
    });
  // const res = await redisClient.flushall('ASYNC');
  // console.log('🚀 ~ RedisRunFunction ~ res:'.red, res);
  //------------------------- delete all keys-----------------------
  const sub = await subRedis.subscribe(...subscribeArray);

  // subRedis.on('message', async (chanel, message) => {
  //   if (chanel === ENUM_REDIS_SUBSCRIBE.socket_message) {
  //     await produceMessageByKafka(message);
  //   }
  // });
};
