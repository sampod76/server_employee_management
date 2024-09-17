import { DefaultJobOptions } from 'bullmq';

export const defaultQueueConfig: DefaultJobOptions = {
  removeOnComplete: {
    count: 0,
    age: 60 * 60,
  },
  attempts: 3,
  backoff: {
    //Backoff setting for automatic retries if the job fails
    type: 'exponential',
    delay: 1000,
  },
};
