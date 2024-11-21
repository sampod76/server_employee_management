import config from '../../config';

// export enum ENUM_KAFKA_TOPIC {
//   MESSAGE = `${config.kafka.clientId as unknown as number}_message`,
// }

export const ENUM_KAFKA_TOPIC = {
  MESSAGE: `${config.kafka.clientId}_message`,
  groupMessage: `${config.kafka.clientId}_groupMessage`,
  friendShipUpdateSortList: `${config.kafka.clientId}_friendShipUpdateSortList`,
  groupMemberUpdateSortList: `${config.kafka.clientId}_groupMemberUpdateSortList`,
} as const;
