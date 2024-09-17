/* eslint-disable @typescript-eslint/no-unused-vars */
import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import { redisConnectionString } from '../../redis/redis';
import { ENUM_QUEUE_NAME } from '../consent.queus';
import { defaultQueueConfig } from '../queue.config';

export const notificationQueue = new Queue(ENUM_QUEUE_NAME.notification, {
  connection: redisConnectionString,
  defaultJobOptions: {
    ...defaultQueueConfig,
    // delay: 500,
  },
});
//----------checks --- notification queue----------------------------
const notificationQueueEvents = new QueueEvents(ENUM_QUEUE_NAME.notification);
export const checkNotificationQueueResult = (jobId: string) => {
  return new Promise((resolve, reject) => {
    notificationQueueEvents.on(
      'completed',
      ({ jobId: completedJobId, returnvalue }) => {
        if (jobId === completedJobId) {
          resolve(returnvalue);
        }
      },
    );
    notificationQueueEvents.on(
      'failed',
      ({ jobId: failedJobId, failedReason }) => {
        if (jobId === failedJobId) {
          reject(new Error(failedReason));
        }
      },
    );
  });
};
//----------end --- notification queue----------------------------

export const handler = new Worker(
  ENUM_QUEUE_NAME.notification,
  async (job: Job) => {
    // console.log('��� ~ job.data:', job.data);
    const { data } = job.data;
    //  console.log('🚀 ~ process.pid:', process.pid, '🚀 ~ data:', data);
    // const result = await sendMailHelper(job.data);
    // console.log('🚀 ~ result:', result);

    return { value: true };
  },
  {
    connection: redisConnectionString,
    // removeOnComplete: {
    //   age: 3600, // keep up to 1 hour
    //   count: 1000, // keep up to 1000 jobs
    // },
    // removeOnFail: {
    //   count: 1000, // keep up to 1000 jobs
    //   age: 24 * 3600, // keep up to 24 hours
    // },
  },
);
