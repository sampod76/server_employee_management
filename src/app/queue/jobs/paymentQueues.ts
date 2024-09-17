// import { Job, Queue, QueueEvents, Worker } from 'bullmq';
// import { ENUM_STATUS, ENUM_YN } from '../../../global/enum_constant_type';
// import { IHostUser } from '../../modules/allUser/hostUser/interface.hostUser';
// import { IReserve } from '../../modules/carsReserving/interface.carsReserving';
// import { Reserve } from '../../modules/carsReserving/models.carsReserving';
// import { ENUM_HOST_PAID_PAYMENT_STATUS } from '../../modules/paidHostPaymentHistory/interface.paidHostPaymentHistory';
// import { PaidHostPaymentHistory } from '../../modules/paidHostPaymentHistory/model.paidHostPaymentHistory';
// import { stripe } from '../../modules/payment/payment.utls';
// import { IPaymentHistory } from '../../modules/paymentHistory/interface.paymentHistory';
// import { redisConnectionString } from '../../redis/redis';
// import { ENUM_QUEUE_NAME } from '../consent.queus';
// import { defaultQueueConfig } from '../queue.config';
// export const paymentQueue = new Queue(ENUM_QUEUE_NAME.payment, {
//   connection: redisConnectionString,
//   defaultJobOptions: {
//     ...defaultQueueConfig,
//     // delay: 500,
//   },
// });
// //----------checks --- payment queue----------------------------
// const paymentQueueEvents = new QueueEvents(ENUM_QUEUE_NAME.payment);
// export const checkPaymentQueueResult = (jobId: string) => {
//   return new Promise((resolve, reject) => {
//     paymentQueueEvents.on(
//       'completed',
//       ({ jobId: completedJobId, returnvalue }) => {
//         if (jobId === completedJobId) {
//           resolve(returnvalue);
//         }
//       },
//     );
//     paymentQueueEvents.on('failed', ({ jobId: failedJobId, failedReason }) => {
//       if (jobId === failedJobId) {
//         reject(new Error(failedReason));
//       }
//     });
//   });
// };
// //----------end --- payment queue----------------------------

// export const handler = new Worker(
//   ENUM_QUEUE_NAME.payment,
//   async (job: Job) => {
//     // console.log('��� ~ job.data:', job.data);
//     const { reservedId } = job.data;
//     let result: any;
//     try {
//       const findReserved = (await Reserve.isReserveExistMethod(reservedId, {
//         populate: true,
//         populateFields: ['acceptedPaymentData'],
//       })) as IReserve & {
//         acceptedPaymentData: IPaymentHistory[];
//         hostUserInfo: IHostUser;
//       };
//       let totalAmount = findReserved.initialReservedPrice;
//       if (findReserved?.reserveComplete?.extraPrice) {
//         // user to
//         if (findReserved?.hostExtraData?.reIssueExtraPrice === 0) {
//           totalAmount = totalAmount + 0;
//         } else if (Number(findReserved.hostExtraData?.reIssueExtraPrice) > 0) {
//           totalAmount =
//             totalAmount + Number(findReserved.hostExtraData?.reIssueExtraPrice);
//         } else {
//           totalAmount =
//             totalAmount + Number(findReserved?.reserveComplete?.extraPrice);
//         }
//       }
//       let paidAmount = totalAmount * (findReserved.hostPercents / 100);
//       if (findReserved.hostExtraData?.damagePrice) {
//         paidAmount =
//           paidAmount + Number(findReserved.hostExtraData?.damagePrice);
//       }

//       const transfer = await stripe.transfers.create({
//         amount: paidAmount * 100, // count cents -- $4 = 400 cents
//         currency: findReserved.acceptedPaymentData[0]?.currency, //Mx er somoy mxn hobe
//         destination: findReserved?.hostUserInfo.stripeAccount
//           ?.accountNo as string, //stripeConnectAccountID
//         //@ts-ignore
//         transfer_group: findReserved?._id?.toString() || '',
//         metadata: {
//           //@ts-ignore
//           reserveId: findReserved?._id?.toString() || '',
//           hostId: findReserved?.hostUser?.userId?.toString(),
//           userId: findReserved?.reserveUser?.userId?.toString(),
//         },
//       });

//       if (transfer.id) {
//         await PaidHostPaymentHistory.findOneAndUpdate(
//           {
//             reserveId: reservedId,
//             isDelete: false,
//             'queue.jobId': job.id,
//           },
//           {
//             queue: {
//               types: ENUM_STATUS.INACTIVE,
//             },
//             paymentStatus: ENUM_HOST_PAID_PAYMENT_STATUS.success,
//           },
//         );
//       }
//     } catch (error: any) {
//       const retryAttempts = job.opts.attempts || 0;
//       let delay;

//       if (retryAttempts === 0) {
//         // First retry after 3 days
//         delay = 259200000; // 3 days in milliseconds
//       } else {
//         // Subsequent retries every 1 day
//         delay = 86400000; // 1 day in milliseconds
//       }

//       // Increment the number of attempts
//       const newAttempts = (retryAttempts || 0) + 1;
//       await paymentQueue.add(job.name, job.data, {
//         delay: delay,
//         jobId: job.id, // Retain the same job ID if desired
//         attempts: newAttempts, // Set the number of attempts
//         removeOnComplete: false, // Keep the job in the queue until it completes
//         removeOnFail: false, // Keep the job in the queue for retry
//       });
//       //! --when any error then automatically set schedule same job for 1day time sate
//       await PaidHostPaymentHistory.findOneAndUpdate(
//         {
//           reserveId: reservedId,
//           isDelete: false,
//           'queue.jobId': job.id,
//         },
//         {
//           paymentStatus: ENUM_HOST_PAID_PAYMENT_STATUS.failure,
//           $push: {
//             errors: {
//               types: 'queue_error',
//               message: error?.message as string,
//               request_log_url: error?.request_log_url, // Adjust as needed
//             },
//           },
//         },
//       );
//       // Optionally, remove the failed job from the queue
//       await job.remove();
//     }
//     // console.log('🚀 ~ process.pid:', process.pid);
//     return { result };
//     // {
//     //     ...findReserved,
//     //     paymentStatus: ENUM_HOST_PAID_PAYMENT_STATUS.failure,
//     //     error: {
//     //       message: error?.message,
//     //       types: error?.type,
//     //       request_log_url: error?.raw.doc_url,
//     //     },
//     //   }
//     // console.log('🚀 ~ result:', result);
//   },
//   {
//     connection: redisConnectionString,
//     removeOnComplete: {
//       age: 3600, // keep up to 1 hour
//       count: 1000, // keep up to 1000 jobs
//     },
//     removeOnFail: {
//       count: 1000, // keep up to 1000 jobs
//       age: 24 * 3600, // keep up to 24 hours
//     },
//   },
// );
