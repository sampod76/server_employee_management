import config from '../../config';

// export enum ENUM_KAFKA_TOPIC {
//   MESSAGE = `${config.kafka.clientId as unknown as number}_message`,
// }

export const ENUM_KAFKA_TOPIC = {
  MESSAGE: `${config.kafka.clientId}_message`,
} as const;
