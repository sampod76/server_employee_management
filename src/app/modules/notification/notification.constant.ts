export const Notification_SearchableFields = ['subject', 'bodyText'];

export const Notification_FilterableFields = [
  'userId',
  'role',
  // always required filter
  'searchTerm',
  'isSendNotification',
  //
  'delete', // for permanent delete
  'status',
  'isDelete',
];
