export const ProjectSearchableFields = ['title'];

export const ProjectFilterableFields = [
  'senderRoleBaseId',
  'senderUserId',
  'receiverRoleBaseId',
  'receiverUserId',

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
