export const friendshipSearchableFields = ['title'];

export const friendshipFilterableFields = [
  'senderRoleBaseId',
  'senderUserId',
  'receiverRoleBaseId',
  'receiverUserId',
  'gigId',
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
