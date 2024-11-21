export const GroupsSearchableFields = ['name', 'project.title'];

export const GroupsFilterableFields = [
  'authorRoleBaseId',
  'authorUserId',
  'gigId',
  'orderId',
  'paymentId',
  'projectStart',
  'projectDeadline',
  'cs_id',
  'myData', //yes no
  // always required filter
  'searchTerm',
  'delete', // for permanent delete
  'status',
  'isDelete',
  'needProperty',
  'createdAtFrom',
  'createdAtTo',
];
