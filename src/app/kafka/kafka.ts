import { Kafka, logLevel } from 'kafkajs';
import config from '../../config';
import { logger } from '../share/logger';
import { ENUM_KAFKA_TOPIC } from './consent.kafka';
import { consumerKafka } from './consumer.kafka';

export const kafkaClient = new Kafka({
  clientId: config.kafka.clientId as string,
  brokers: [config.kafka.url as string],
  logLevel: logLevel.ERROR,
});

export async function kafkaInit() {
  try {
    const admin = kafkaClient.admin();
    await admin.connect();

    // Fetch the list of existing topics
    const existingTopics = await admin.listTopics();
    // console.log('🚀 ~ kafkaInit ~ existingTopics:', existingTopics);

    //! ******** Fetch and log details for each topic*****
    /*  
     const metadata = await admin.fetchTopicMetadata({
      topics: existingTopics,
       });
     console.log('🚀 ~ kafkaInit ~ metadata:', metadata.topics[0]);
    */
    //! ******** delete topics ******
    /* 
    const deleteRes = await admin.deleteTopics({
      topics: [ENUM_KAFKA_TOPIC.MESSAGE],
    });
    console.log('🚀 ~ kafkaInit ~ deleteRes:', deleteRes);
     */

    const currentPartitions = 3;
    // Check if the specific topic exists
    if (!existingTopics.includes(ENUM_KAFKA_TOPIC.MESSAGE)) {
      // Topic does not exist, so create it
      const res = await admin.createTopics({
        // waitForLeaders: true,
        // validateOnly: true,
        // timeout: 5000,
        topics: [
          {
            topic: ENUM_KAFKA_TOPIC.MESSAGE,
            numPartitions: currentPartitions, // Starting with 1 partition
            // numPartitions: 4, // Uncomment this line if you want more partitions
          },
        ],
      });
      console.log('🚀 ~ kafkaInit ~ res:', res);
    } else {
      console.log(`Topic "${ENUM_KAFKA_TOPIC.MESSAGE}" already exists.`);
      // Increase the number of partitions
      /* 
      const newPartitionCount = 3; // Specify the new number of partitions
      const currentPartitions =
        metadata.topics.find(topic => topic.name === ENUM_KAFKA_TOPIC.MESSAGE)
          ?.partitions.length || 0;

      if (currentPartitions < newPartitionCount) {
        console.log(
          `Increasing partitions for topic "${ENUM_KAFKA_TOPIC.MESSAGE}" from ${currentPartitions} to ${newPartitionCount}`,
        );

        const res = await admin.createPartitions({
          topicPartitions: [
            {
              topic: ENUM_KAFKA_TOPIC.MESSAGE,
              count: newPartitionCount,
            },
          ],
        });
        console.log('🚀 ~ kafkaInit ~ Partition increase result:', res);
      } else {
        console.log(
          `Topic "${ENUM_KAFKA_TOPIC.MESSAGE}" already has ${currentPartitions} partitions.`,
        );
      }
   */
    }

    await admin.disconnect();
    await consumerKafka();
  } catch (error) {
    if (config.env === 'production') {
      logger.error(error);
    } else {
      console.log('🚀 ~ kafkaInit ~ error:', error);
    }
  }
}
