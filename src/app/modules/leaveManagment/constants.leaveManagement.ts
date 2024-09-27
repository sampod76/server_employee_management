export enum ENUM_LEAVE_MANAGEMENT_STATUS {
  pending = 'pending',
  approved = 'approved',
  declined = 'declined',
  //
}
export type ILeaveManagementStatus = keyof typeof ENUM_LEAVE_MANAGEMENT_STATUS;
export const LeaveManagementArray = Object.values(ENUM_LEAVE_MANAGEMENT_STATUS);

//
export const LeaveManagementSearchableFields = [
  'reason',
  'location',
  'employee.details.name.firstName',
  'employee.details.name.lastName',
  'employee.details.email',
];
export const LeaveManagementFilterableFields = [
  'employeeUserId',
  'employeeRoleBaseId',
  'requestStatus',
  //
  'myData', //yes no
  'checkInTime',
  'checkOutTime',
  // always required filter
  'searchTerm',
  'status',
  'isDelete',
  'createdAtFrom',
  'createdAtTo',
  'needProperty',
];
