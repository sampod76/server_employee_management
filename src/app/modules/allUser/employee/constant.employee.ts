export const EmployeeSearchableFields = [
  'email',
  'name.firstName',
  'name.lastName',
  'address',
];

export const EmployeeFilterableFields = [
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
