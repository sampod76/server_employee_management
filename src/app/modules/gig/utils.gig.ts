import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { ENUM_STATUS, ENUM_YN } from '../../../global/enum_constant_type';
import ApiError from '../../errors/ApiError';
import { IGig } from './interface.gig';
import { Gig } from './models.gig';

export const findAndValidationGig = async (id: string | Types.ObjectId) => {
  try {
    const find = (await Gig.findById(id)) as IGig;
    if (!find) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Gig not found');
    } else if (find.isDelete === ENUM_YN.YES) {
      throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Gig has been deleted');
    } else if (find.status === ENUM_STATUS.INACTIVE) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Gig is deactivate');
    } else {
      return find;
    }
  } catch (error: any) {
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, error?.message);
  }
};
