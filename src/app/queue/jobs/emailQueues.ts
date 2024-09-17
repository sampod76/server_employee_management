import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import { sendMailHelper } from '../../../utils/sendMail';
import { redisConnectionString } from '../../redis/redis';
import { ENUM_QUEUE_NAME } from '../consent.queus';
import { defaultQueueConfig } from '../queue.config';

export const emailQueue = new Queue(ENUM_QUEUE_NAME.email, {
  connection: redisConnectionString,
  blockingConnection: false,
  defaultJobOptions: {
    ...defaultQueueConfig,
    // delay: 500,
  },
});
//----------checks --- email queue----------------------------
const emailQueueEvents = new QueueEvents(ENUM_QUEUE_NAME.email);
export const checkEmailQueueResult = (jobId: string) => {
  return new Promise((resolve, reject) => {
    emailQueueEvents.on(
      'completed',
      ({ jobId: completedJobId, returnvalue }) => {
        if (jobId === completedJobId) {
          resolve(returnvalue);
        }
      },
    );
    emailQueueEvents.on('failed', ({ jobId: failedJobId, failedReason }) => {
      if (jobId === failedJobId) {
        reject(new Error(failedReason));
      }
    });
  });
};
//----------end --- email queue----------------------------

export const handler = new Worker(
  ENUM_QUEUE_NAME.email,
  async (job: Job) => {
    // console.log('��� ~ job.data:', job.data);
    // const {} = job.data;
    const result = await sendMailHelper(job.data);
    // console.log('🚀 ~ result:', result);
    //  console.log('🚀 ~ process.pid:', process.pid);
    return { result };
  },
  {
    // connection: redisConnectionString,
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
