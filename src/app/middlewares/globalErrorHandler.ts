/* eslint-disable @typescript-eslint/no-unused-vars */
import { ErrorRequestHandler } from 'express';
// import { errorLogger } from '../share/logger'
// import { logger } from '../share/logger'
import { ZodError } from 'zod';
import config from '../../config';
import ApiError from '../errors/ApiError';
import { handleValidationError } from '../errors/handleValidationError';
import handleZodError from '../errors/handleZodError';
import { IGenericErrorMessage } from '../interface/error';
// import { errorLogger } from '../share/logger';
import httpStatus from 'http-status';
import { requestToDeleteFile } from '../../helper/requestToDeleteFile';
import handleCastError from '../errors/handleCastError';
import handleMongoUniqueError from '../errors/handleMongoUniqueError';
import { errorLogger } from '../share/logger';

// import path from 'path';

//
const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  config.env === 'development'
    ? console.log(`globalErrorHandler:`, error)
    : errorLogger.error(`globalErrorHandler:`, error);

  let statusCode = 500;
  let message = 'Something went wrong';

  //! ----- if any error then remove file ----
  requestToDeleteFile(req);
  // -----------------------------------------
  // let errorMessage:Array<IGenericErrorMessage>= []
  let errorMessage: IGenericErrorMessage[] = [];

  if (error?.name === 'ValidationError') {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessage = simplifiedError.errorMessages;
  } else if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessage = simplifiedError.errorMessages;
  } else if (error?.name === 'CastError') {
    const simplifiedError = handleCastError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessage = simplifiedError.errorMessages;
  } else if (error.name === 'MongoServerError' && error.code === 11000) {
    const simplifiedError = handleMongoUniqueError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessage = simplifiedError.errorMessages;
  } else if (error?.name === 'JsonWebTokenError') {
    statusCode = httpStatus.UNAUTHORIZED;
    message = 'Unauthorized access';
    // errorMessage = "unauthorized access";
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessage = error?.message
      ? [
          {
            path: '',
            message: error?.message,
          },
        ]
      : [];
  }

  //  else if (error instanceof Roleback) {
  //   statusCode = error.statusCode;
  //   message = error.message;
  //   errorMessage = error?.message
  //     ? [
  //         {
  //           path: '',
  //           message: error?.message,
  //         },
  //       ]
  //     : [];
  // }
  else if (error instanceof Error) {
    message = error.message;
    errorMessage = error?.message
      ? [
          {
            path: '',
            message: error?.message,
          },
        ]
      : [];
  }

  /*  res.status(statusCode).send({
    success: false,
    message,
    errorMessage,
    stack: config.env !== 'production' ? error?.stack : undefined,
  }); */
  try {
    //! --- no need every message set req.t("") --
    return res.status(statusCode).send({
      success: false,
      message: req.t(message), //
      errorMessage,
      stack: config.env !== 'production' ? error?.stack : undefined,
    });
  } catch (error: any) {
    res.status(statusCode).send({
      success: false,
      message: message, //
      errorMessage,
      stack: config.env !== 'production' ? error?.stack : undefined,
    });
  }
};

export default globalErrorHandler;
