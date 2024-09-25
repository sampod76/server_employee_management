import { redisClient } from './app/redis/redis';
import { createDirectories } from './utils/createDir';

const TestFile = async () => {
  try {
    const res = await redisClient().set('test', 'sfsdjkfsd');
    const res2 = await redisClient().get('test');
    console.log('🚀 ~ TestFile ~ res:', res2);
    createDirectories();
    await asyncFunction();
  } catch (error) {
    console.log(error);
  }
};

const asyncFunction = async () => {
  try {
    // console.log('first');
    return 1;
  } catch (error) {
    console.log(error);
  }
};

export { TestFile };
