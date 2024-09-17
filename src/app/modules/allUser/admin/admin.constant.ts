export const adminSearchableFields = [
  'email',
  'name.firstName',
  'name.lastName',
  'address',
];

export const adminFilterableFields = [
  'author',
  'userId',
  'gender',
  'contactNumber',
  // always required filter
  'searchTerm',
  'delete', // for permanent delete
  'status',
  'isDelete',
];
