// import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';
import { IGenericErrorMessage } from '../interface/error';

const handleMongoUniqueError = (error: MongoServerError) => {
  // const errors: IGenericErrorMessage[] = [
  //   {
  //     path: error.path || '',
  //     message: 'Invallid object id',
  //   },
  // ];
  const errors: IGenericErrorMessage[] = Object.keys(error.keyValue).map(
    key => ({
      path: error?.path || '',
      message: key + ': ' + error?.keyValue[key] + ' already exists.',
    }),
  );

  const statusCode = 400;
  return {
    statusCode,
    message: 'Unique error',
    errorMessages: errors,
  };
};

export default handleMongoUniqueError;
