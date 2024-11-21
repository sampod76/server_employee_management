import { Partitioners, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { ENUM_KAFKA_TOPIC } from './consent.kafka';
import { kafkaClient } from './kafka';

let producer: Producer | null = null;

export const createProducer = async () => {
  if (producer) return producer;
  // const _producer = kafkaClient.producer();
  const _producer = kafkaClient.producer({
    createPartitioner: Partitioners.DefaultPartitioner,
    retry: {
      retries: 5,
      initialRetryTime: 10000,
    },
  });
  await _producer.connect();
  producer = _producer;
  return producer;
};

export const produceMessageByKafka = async (message: string) => {
  const producer = await createProducer();
  // console.log('🚀 ~ eachMessage: ~ data:', message);
  await producer.send({
    topic: ENUM_KAFKA_TOPIC.MESSAGE,
    messages: [
      { key: 'message:' + uuidv4(), value: message, partition: 0 },
      //   { key: 'message:' + uuidv4(), value: 'Hello, Kafka!', partition: 0 },
    ],
  });
};
export const produceGroupMessageByKafka = async (message: string) => {
  const producer = await createProducer();
  console.log('🚀 ~ eachMessage: ~ data:', message);
  await producer.send({
    topic: ENUM_KAFKA_TOPIC.groupMessage,
    messages: [
      { key: 'message:' + uuidv4(), value: message, partition: 0 },
      //   { key: 'message:' + uuidv4(), value: 'Hello, Kafka!', partition: 0 },
    ],
  });
};
export const produceUpdateFriendShipListSortKafka = async (message: string) => {
  const producer = await createProducer();
  // console.log('🚀 ~ eachMessage: ~ data:', message);
  await producer.send({
    topic: ENUM_KAFKA_TOPIC.friendShipUpdateSortList,
    messages: [
      {
        key: 'friendShipUpdateSortList:' + uuidv4(),
        value: message,
        partition: 0,
      },
      //   { key: 'message:' + uuidv4(), value: 'Hello, Kafka!', partition: 0 },
    ],
  });
};
export const produceUpdateGroupMemberListSortKafka = async (
  message: string,
) => {
  const producer = await createProducer();
  // console.log('🚀 ~ eachMessage: ~ data:', message);
  await producer.send({
    topic: ENUM_KAFKA_TOPIC.friendShipUpdateSortList,
    messages: [
      {
        key: 'friendShipUpdateSortList:' + uuidv4(),
        value: message,
        partition: 0,
      },
      //   { key: 'message:' + uuidv4(), value: 'Hello, Kafka!', partition: 0 },
    ],
  });
};
