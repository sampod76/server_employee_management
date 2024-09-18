export enum ENUM_TASK_PROGRESS_STATUS {
  toDo = 'toDo',
  inProgress = 'inProgress',
  done = 'done',
}
export const TaskProgressStatusArray = Object.values(ENUM_TASK_PROGRESS_STATUS);
export type ITaskProgressStatus = keyof typeof ENUM_TASK_PROGRESS_STATUS;
//
export const ProjectSearchableFields = ['title'];
export const ProjectFilterableFields = [
  'employeeRoleBaseId',
  'employeeUserId',
  //
  'myData', //yes no
  // always required filter
  'searchTerm',
  'status',
  'isDelete',
  'createdAtFrom',
  'createdAtTo',
  'needProperty',
];
