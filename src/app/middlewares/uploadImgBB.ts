/* eslint-disable @typescript-eslint/ban-ts-comment */
import config from '../../config';
import { unlinkFile } from '../../utils/unlinkFile';
import ApiError from '../errors/ApiError';
import { IFileAfterUpload, IMulterUploadFile } from '../interface/fileUpload';
//@ts-ignore
import imgbbUploader from 'imgbb-uploader';
type ImageData = {
  filename: string;
  name: string;
  mime: string;
  extension: string;
  url: string;
};

export type ITypeImgbb = {
  id: string;
  title: string;
  url_viewer: string;
  url: string;
  display_url: string;
  size: number;
  time: string;
  expiration: string;
  image: ImageData;
  thumb: ImageData;
  medium: ImageData;
  delete_url: string;
};

const uploadSingleFileImgbb = async (
  file: IMulterUploadFile,
): Promise<IFileAfterUpload | undefined> => {
  return new Promise((resolve, reject) => {
    imgbbUploader(config.imgbb_key as string, file.path)
      .then((response: ITypeImgbb) => {
        const modifyAndAddImage = {
          mimetype: file.mimetype,
          filename: file.filename,
          server_url: `images/${file.filename}`,
          url: response?.url,
          durl: response?.delete_url,
          platform: 'imgbb',
          fieldname: file?.fieldname, //it is important because it  is use body
        };
        return resolve(modifyAndAddImage);
      })
      .catch((error: any) => {
        return reject(error);
      });
  });
};

const uploadMultipleFileImgbb = async (
  files: IMulterUploadFile[],
): Promise<IFileAfterUpload[] | undefined | any> => {
  // console.log('🚀 ~ files:', files);
  const uploadPromises = files.map(file => {
    return new Promise((resolve, reject) => {
      imgbbUploader(config.imgbb_key as string, file.path)
        .then((response: ITypeImgbb) => {
          const modifyAndAddImage = {
            mimetype: file.mimetype,
            filename: file.filename,
            server_url: `images/${file.filename}`,
            url: response?.url,
            durl: response?.delete_url,
            platform: 'imgbb',
            fieldname: file?.fieldname, //not use
          };
          return resolve(modifyAndAddImage);
        })
        .catch((error: any) => reject(error));
    });
  });

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    // console.log("🚀 ~ error:", error)
    files.forEach(file => {
      unlinkFile(file.path);
    });
    throw new ApiError(400, 'Error uploading');
  }
};

export const ImgbbUploader = { uploadSingleFileImgbb, uploadMultipleFileImgbb };
