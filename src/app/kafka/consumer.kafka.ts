/* eslint-disable @typescript-eslint/no-unused-vars */
import config from '../../config';
import { ChatMessageService } from '../modules/message/messages.service';
import { ENUM_KAFKA_TOPIC } from './consent.kafka';
import { kafkaClient } from './kafka';

export const consumerKafka = async () => {
  const consumer = kafkaClient.consumer({
    groupId: config.kafka.clientId + 'message', // kafka group id is unique must --> because another project run same kafka same group then adapt this
    retry: {
      retries: 5,
      initialRetryTime: 10000,
    },
  });
  await consumer.connect();
  await consumer.subscribe({
    topics: [ENUM_KAFKA_TOPIC.MESSAGE],
    fromBeginning: true,
  });
  await consumer.run({
    autoCommit: true,
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
      if (topic === ENUM_KAFKA_TOPIC.MESSAGE) {
        if (message.value) {
          const data = JSON.parse(message.value?.toString());
          try {
            const result = await ChatMessageService.createChatMessage(data);
            console.log('🚀 ~ eachMessage: ~ result:', result?._id as string);
          } catch (error: any) {
            console.log('🚀 ~ eachMessage: ~ error:', error);

            if (error?.status === 503) {
              pause();
              setTimeout(() => {
                console.log('Resuming consumer...');
                consumer.resume([{ topic: ENUM_KAFKA_TOPIC.MESSAGE }]);
              }, 60 * 1000); // Pause for 60 seconds
            }
          }
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
