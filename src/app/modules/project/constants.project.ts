export const ProjectSearchableFields = ['title', 'description', 'clientName'];

export const ProjectFilterableFields = [
  'authorRoleBaseId',
  'authorUserId',
  'clientEmail',

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
