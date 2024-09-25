import { IChatMessage } from '../modules/message/messages.interface';
import { ChatMessageService } from '../modules/message/messages.service';
import { redisClient } from './redis';

export const consumerRedis = async (): Promise<void> => {
  const streamKey = 'message_stream';
  const consumerGroup = 'message_group';
  const consumerName = 'message_consumer';

  // Create the consumer group if it doesn't exist
  try {
    //@ts-ignore
    await redisClient.xgroup('CREATE', streamKey, consumerGroup, '$', {
      MKSTREAM: true,
    });
  } catch (error: unknown) {
    if (error instanceof Error && !error.message.includes('BUSYGROUP')) {
      console.error('Error creating consumer group:', error);
    }
  }

  const processMessages = async (): Promise<void> => {
    try {
      // Read messages from the stream for the consumer group
      const messages = await redisClient.xreadgroup(
        'GROUP',
        consumerGroup,
        consumerName,
        'COUNT',
        10, // Number of messages to read at once
        'BLOCK',
        5000, // Block for 5 seconds if no messages are available
        'STREAMS',
        streamKey,
        '>',
      );

      if (messages) {
        //@ts-ignore
        for (const [, entries] of messages) {
          for (const [messageId, messageData] of entries) {
            const messageValue = messageData.find(
              ([, value]: any) => value,
            )?.[1];
            if (messageValue) {
              const data: IChatMessage = JSON.parse(messageValue);
              try {
                // Attempt to process the message
                const result = await ChatMessageService.createChatMessage(data);
                console.log(
                  '🚀 Message processed successfully:',
                  result?._id as string,
                );

                // Acknowledge the message to remove it from the stream
                await redisClient.xack(streamKey, consumerGroup, messageId);
              } catch (error: any) {
                console.error('Error processing message:', error);

                // If the error is related to the database being unavailable
                if (
                  error?.status === 503 ||
                  error.message.includes('Database connection failed')
                ) {
                  console.log(
                    'Database is down. Pausing processing for 1 minute...',
                  );
                  setTimeout(() => {
                    processMessages(); // Retry processing after 1 minute
                  }, 60 * 1000); // Pause for 60 seconds
                  return;
                }
                // Optionally: Add the message to a dead-letter list or log for later processing
              }
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error('Error reading from Redis stream:', error);
    } finally {
      // Continue processing messages
      process.nextTick(processMessages);
    }
  };

  // Start processing messages
  processMessages();
};

// Function to add messages to the Redis stream
export const addMessageToStream = async (
  message: IChatMessage,
): Promise<void> => {
  await redisClient.xadd(
    'message_stream',
    '*',
    'data',
    JSON.stringify(message),
  );
};
