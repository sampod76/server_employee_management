export const GroupMemberSearchableFields = ['title'];

export const GroupMemberFilterableFields = [
  'senderRoleBaseId',
  'senderUserId',
  'receiverRoleBaseId',
  'receiverUserId',
  'groupId',
  'orderId',
  'isBlock', //yes no
  'requestAccept', //yes no
  'myData', //yes no
  // always required filter
  'searchTerm',
  'delete', // for permanent delete
  'status',
  'isDelete',
  'needProperty',
];
