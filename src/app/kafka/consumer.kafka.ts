/* eslint-disable @typescript-eslint/no-unused-vars */

import { ENUM_KAFKA_TOPIC } from './consent.kafka';
import { kafkaClient } from './kafka';
import config from '../../config';
import { ChatMessageService } from '../modules/messageing/message/messages.service';
import { GroupMessageService } from '../modules/messageing/groupMessage/service.groupMessage';
import { FriendShip } from '../modules/messageing/friendship/friendship.models';
import { logger } from '../share/logger';

export const consumerKafka = async () => {
  const topics = [
    ENUM_KAFKA_TOPIC.MESSAGE,
    ENUM_KAFKA_TOPIC.groupMessage,
    ENUM_KAFKA_TOPIC.friendShipUpdateSortList,
  ];
  const consumer = kafkaClient.consumer({
    //config.kafka.clientId=chatapplication (example)
    groupId: config.kafka.clientId + 'message', // kafka group id is unique must --> because another project run same kafka, same group then adapt this
    retry: {
      retries: 5,
      initialRetryTime: 10000,
    },
  });
  await consumer.connect();
  await consumer.subscribe({
    topics: topics,
    fromBeginning: true,
  });
  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
      try {
        if (topic === ENUM_KAFKA_TOPIC.MESSAGE) {
          if (message.value) {
            const data = JSON.parse(message.value?.toString());
            const result = await ChatMessageService.createChatMessage(data);
            await consumer.commitOffsets([
              {
                topic,
                partition,
                offset: (parseInt(message.offset) + 1).toString(),
              },
            ]);
          }
        } else if (topic === ENUM_KAFKA_TOPIC.groupMessage) {
          if (message.value) {
            const data = JSON.parse(message.value?.toString());
            const result = await GroupMessageService.createGroupMessage(data);
            await consumer.commitOffsets([
              {
                topic,
                partition,
                offset: (parseInt(message.offset) + 1).toString(),
              },
            ]);
            // console.log('🚀 ~ eachMessage: ~ result:', result);
          }
        } else if (topic === ENUM_KAFKA_TOPIC.friendShipUpdateSortList) {
          if (message.value) {
            const data = JSON.parse(message.value?.toString());
            // TODO: implement your logic here
            const updatedFriendShip = await FriendShip.findOneAndUpdate(
              { _id: data?.id },
              data?.value,
              {
                new: true,
                runValidators: true,
              },
            );
            await consumer.commitOffsets([
              {
                topic,
                partition,
                offset: (parseInt(message.offset) + 1).toString(),
              },
            ]);
          }
        }
      } catch (error: any) {
        console.log('🚀 ~ eachMessage: ~ error:', error);
        logger.error(error);
        if (error?.status === 503) {
          pause();
          setTimeout(() => {
            console.log('Resuming consumer...');
            // consumer.resume([{ topic: ENUM_KAFKA_TOPIC.MESSAGE }]);
            consumer.resume(
              topics.map(singleTopic => ({ topic: singleTopic })),
            );
          }, 60 * 1000); // Pause for 60 seconds
        }
      }
    },
  });
};

/* 

import { kafkaClient } from './kafka';
import { ENUM_KAFKA_TOPIC } from './consent.kafka';
import { ChatMessageService } from '../modules/message/messages.service';

export const consumerKafka = async () => {
  const consumer = kafkaClient.consumer({ groupId: 'message' });
  await consumer.connect();
  await consumer.subscribe({ topic: ENUM_KAFKA_TOPIC.MESSAGE, fromBeginning: true });

  await consumer.run({
    eachBatchAutoResolve: false, // Disable automatic offset commit
    eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary, pause }) => {
      const messagesBuffer = [];
      try {
        // Collect messages from the batch
        for (let message of batch.messages) {
          if (message.value) {
            const data = JSON.parse(message.value.toString());
            messagesBuffer.push(data);
            resolveOffset(message.offset); // Mark the message as processed
          }
        }

        // Process the collected messages in bulk
        if (messagesBuffer.length > 0) {
          await ChatMessageService.createChatMessageBulk(messagesBuffer);
          console.log('Batch processed successfully:', messagesBuffer);
        }

        // Commit the offsets for the processed batch
        await commitOffsetsIfNecessary();
        await heartbeat(); // Maintain consumer connection
      } catch (error: any) {
        console.error('Error processing batch:', error);

        if (error?.status === 503) {
          console.log('Pausing consumer due to 503 error...');
          pause();
          setTimeout(() => {
            console.log('Resuming consumer...');
            consumer.resume([{ topic: ENUM_KAFKA_TOPIC.MESSAGE }]);
          }, 60 * 1000); // Resume after 60 seconds
        } else {
          // Handle other errors, possibly with retries or alerting
        }
      }
    },
  });
};


*/
