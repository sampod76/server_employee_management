export const buyerSearchableFields = [
  'email',
  'name.firstName',
  'name.lastName',
  'address',
];

export const buyerFilterableFields = [
  'userUniqueId',
  'userId',
  'gender',
  'needProperty',
  'verify',
  // always required filter
  'searchTerm',
  'delete', // for permanent delete
  'status',
  'isDelete',
];
