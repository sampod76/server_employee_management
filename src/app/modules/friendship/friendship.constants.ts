export const friendshipSearchableFields = ['title'];

export const friendshipFilterableFields = [
  'senderRoleBaseId',
  'senderUserId',
  'receiverRoleBaseId',
  'receiverUserId',

  'isBlock', //yes no
  'requestAccept', //yes no
  'myData', //yes no
  // always required filter
  'delete', // for permanent delete
  'searchTerm',
  'status',
  'isDelete',
  'createdAtFrom',
  'createdAtTo',
  'needProperty',
];
