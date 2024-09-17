export enum ENUM_REDIS_SUBSCRIBE {
  socket_message = 'socket_message',
  socket_user = 'socket_user',
  test = 'test',
}

export const subscribeArray = [
  ENUM_REDIS_SUBSCRIBE.socket_message,
  ENUM_REDIS_SUBSCRIBE.socket_user,
  ENUM_REDIS_SUBSCRIBE.test,
];
export enum ENUM_REDIS_KEY {
  socket_user = 'socket:user:',
  REDIS_IN_SAVE_FRIENDSHIP = 'redis:friendShip:',
  REDIS_IN_SAVE_ALL_TEXT_FIELDS = 'redis:alltextfields:',
  REDIS_IN_SAVE_ALL_USERS = 'redis:users:',
}
