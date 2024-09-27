/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
import { v2 as cloudinary } from 'cloudinary';

import {
  ICloudinaryResponse,
  IFileAfterUpload,
  IMulterUploadFile,
} from '../interface/fileUpload';

import config from '../../config';
import ApiError from '../errors/ApiError';

import { unlinkFile } from '../../utils/unlinkFile';

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

const uploadToCloudinary = async (
  file: IMulterUploadFile,
): Promise<ICloudinaryResponse | undefined> => {
  return new Promise<ICloudinaryResponse | IFileAfterUpload | any>(
    (resolve, reject) => {
      cloudinary.uploader.upload(
        file.path,
        function (error: Error, result: ICloudinaryResponse) {
          // for after upload then remove it
          //  unlinkFile(file.path)
          if (error) {
            unlinkFile(file.path);
            reject(error);
          } else {
            const response = {
              mimetype: file.mimetype,
              filename: file.filename,
              fieldname: file.fieldname,
              server_url: `images/${file.filename}`,
              url: result?.url,
              platform: 'cloudinary',
            };
            resolve(response);
          }
        },
      );
    },
  );
};

const uploadToCloudinaryMultiple = async (
  files: IMulterUploadFile[],
): Promise<ICloudinaryResponse[] | IFileAfterUpload[] | undefined> => {
  const uploadPromises = files.map(file => {
    return new Promise<ICloudinaryResponse | any>((resolve, reject) => {
      uploadToCloudinary(file)
        .then(res => resolve(res))
        .catch(error => reject(error));

      /* 
        cloudinary.uploader.upload(
        file.path,
        function (error: Error, result: ICloudinaryResponse) {
          if (error) {
            unlinkFile(file.path);
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

        */
    });
  });

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    files.forEach(file => {
      unlinkFile(file.path);
    });
    throw new ApiError(400, 'Error uploading to Cloudinary');
  }
};

export const FileUploadHelper = {
  uploadToCloudinary,
  uploadToCloudinaryMultiple,
};
