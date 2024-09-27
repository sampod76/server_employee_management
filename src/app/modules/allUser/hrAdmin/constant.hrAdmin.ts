export const HrAdminSearchableFields = [
  'email',
  'name.firstName',
  'name.lastName',
  'address',
  'contactNumber',
];

export const HrAdminFilterableFields = [
  'userUniqueId',
  'userId',
  'gender',
  'countryName',
  'skills',
  'dateOfBirth',
  'needProperty',
  'verify',
  'createdAtFrom',
  'createdAtTo',
  // always required filter
  'searchTerm',
  'delete', // for permanent delete
  'status',
  'isDelete',
];
