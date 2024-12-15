// export enum ENUM_SOCKET_EMIT_ON_TYPE {
//   SERVER_TO_CLIENT_PERSONAL_MESSAGE = 'server_to_client_personal_message',
//   CLIENT_TO_SERVER_PERSONAL_MESSAGE = 'client_to_server_personal_message',
//   ONLINE_OFFLINE_USER = 'online_offline_user:',
//   LATEST_FRIEND = 'latest_friend',
// }

export enum ENUM_SOCKET_EMIT_ON_TYPE {
  SERVER_TO_CLIENT_PERSONAL_MESSAGE = 'server_to_client_personal_message:', //optional (:)
  CLIENT_TO_SERVER_PERSONAL_MESSAGE = 'client_to_server_personal_message',
  //
  SERVER_TO_CLIENT_GROUP_MESSAGE = 'server_to_client_group_message:', //+groupId
  CLIENT_TO_SERVER_GROUP_MESSAGE = 'client_to_server_group_message',
  //
  ONLINE_OFFLINE_USER = 'online_offline_user:',
  LATEST_FRIEND = 'latest_friend:',
}
