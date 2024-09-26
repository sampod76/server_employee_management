//
export const CheckInOutSearchableFields = [
  'employee.details.name.firstName',
  'employee.details.name.lastName',
  'employee.details.email',
];
export const CheckInOutFilterableFields = [
  'authorRoleBaseId',
  'authorUserId',
  //
  'myData', //yes no
  'checkInTime',
  'checkOutTime',
  'toDay',
  // always required filter
  'searchTerm',
  'status',
  'isDelete',
  'createdAtFrom',
  'createdAtTo',
  'needProperty',
];
