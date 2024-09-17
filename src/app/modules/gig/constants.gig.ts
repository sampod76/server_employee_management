export enum ENUM_ORDER_PACKAGE_NAME {
  bronze = 'bronze',
  silver = 'silver',
  gold = 'gold',
  platinum = 'platinum',
  extraPackage = 'extraPackage',
  custom = 'custom',
}

export const GigSearchableFields = ['title', 'additionalDescription', 'tags'];

export const GigFilterableFields = [
  'sellerUserId',
  'sellerRoleUserId',
  'category',
  'verify',
  'selectField',
  'priceStart',
  // always required filter
  'searchTerm',
  'delete', // for permanent delete
  'status',
  'isDelete',
  'needProperty',
  'createdAtFrom',
  'createdAtTo',
];
