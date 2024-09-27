export enum ENUM_TASK_PROGRESS_STATUS {
  toDo = 'toDo',
  inProgress = 'inProgress',
  done = 'done',
}
export const TaskProgressStatusArray = Object.values(ENUM_TASK_PROGRESS_STATUS);
export type ITaskProgressStatus = keyof typeof ENUM_TASK_PROGRESS_STATUS;
//
export const TaskManagementSearchableFields = [
  'title',
  'employee.details.name.firstName',
  'employee.details.name.lastName',
  'employee.details.email',
];
export const TaskManagementFilterableFields = [
  'employeeRoleBaseId',
  'employeeUserId',
  'authorUserId',
  'authorRoleBaseId',
  'projectId',
  //
  'myData', //yes no
  'startDate',
  'endDate',
  // always required filter
  'searchTerm',
  'status',
  'isDelete',
  'createdAtFrom',
  'createdAtTo',
  'needProperty',
];
