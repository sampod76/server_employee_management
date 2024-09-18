import { Model, Types } from 'mongoose';
import { z } from 'zod';
import { I_STATUS, I_YN } from '../../../global/enum_constant_type';
import { CategoryValidation } from './validation.category';

export type ICategoryFilters = {
  searchTerm?: string;
  title?: string;
  status?: I_STATUS;
  serialNumber?: number;
  delete?: I_YN;
  children?: string;
  isDelete?: string | boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
  needProperty?: string;
};

export type ICategory = z.infer<
  typeof CategoryValidation.createCategoryBodyData
> & {
  isDelete: boolean;

  oldRecord?: {
    refId: Types.ObjectId;
    collection?: string;
  };
};

export type CategoryModel = Model<ICategory, Record<string, unknown>>;
