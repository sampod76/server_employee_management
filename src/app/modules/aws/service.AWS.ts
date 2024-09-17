/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request } from 'express';
import { IAwsBodyData, IAwsOutputPreUrl } from './interface.AWS';
import {
  multipleImageObjectCommandToUrl,
  putSingleImageObjectCommandToUrl,
} from './utls.aws';

const createAwsUploadFilesTokenFromDb = async (
  body: IAwsBodyData,
  req: Request,
): Promise<
  Record<keyof IAwsBodyData, IAwsOutputPreUrl | IAwsOutputPreUrl[]>
> => {
  const promiseResponse = Object.entries(body).map(([key, value]) => {
    if (Array.isArray(value) && value.length) {
      return new Promise((resolve, reject) => {
        multipleImageObjectCommandToUrl(value)
          .then(res => {
            return resolve({ [key]: res });
          })
          .catch(err => {
            return reject(err);
          });
      });
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      return new Promise((resolve, reject) => {
        putSingleImageObjectCommandToUrl(value)
          .then(res => {
            return resolve({ [key]: res });
          })
          .catch(err => {
            return reject(err);
          });
      });
    }
  });
  const asyncResponse = (await Promise.all(promiseResponse)) as Array<
    Record<keyof IAwsBodyData, IAwsOutputPreUrl | IAwsOutputPreUrl[]>
  >;

  const arrayToObject: Record<keyof IAwsBodyData | string, any> = {};
  asyncResponse.forEach(res => {
    const key = Object.keys(res)[0];
    arrayToObject[key as keyof IAwsBodyData] = res[key as keyof IAwsBodyData];
  });

  return arrayToObject;
};

export const AWSService = {
  createAwsUploadFilesTokenFromDb,
};
