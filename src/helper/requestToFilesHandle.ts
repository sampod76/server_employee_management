import { Request } from 'express';
import httpStatus from 'http-status';
import ApiError from '../app/errors/ApiError';
import {
  IAws_MulterUploadFile,
  IFileAfterUpload,
  IMulterUploadFile,
} from '../app/interface/fileUpload';
import { ImgbbUploader } from '../app/middlewares/uploadImgBB';
import { FileUploadHelper } from '../app/middlewares/uploderCloudinary';
import config from '../config';
import { bytesToKbAndMb } from '../utils/bytesTokbAndMb';

/*
 class makeImage {
  mimetype: string;
  filename: string | undefined;
  server_url: string | undefined;
  url: string | undefined;
  path: string | undefined;
  cnd: string | undefined;
  platform: string | undefined;
  durl: string | undefined;
  constructor(file: IFileAfterUpload & IMulterUploadFile) {
    this.mimetype = file.mimetype;
    this.filename = file.filename;
    this.path = file.path;
    this.server_url = file.server_url;
    this.platform = file?.platform || 'server';
    if (file?.url) {
      this.url = file.url;
      this.cnd = file.cdn;
      this.durl = file.durl;
    }
  }
}
   */

export const RequestToFileDecodeAddBodyHandle = async (req: Request) => {
  // console.log(req.file, 'req.file');
  try {
    const file = req.file as IMulterUploadFile;
    // const d = new makeImage(file);
    // after any file is object

    if (file?.filename) {
      const bodyData = { ...req.body };

      if (file.mimetype.includes('pdf')) {
        bodyData[file.fieldname] = {
          mimetype: file.mimetype,
          filename: file.filename,
          server_url: `pdfs/${file.filename}`,
          platform: 'server',
        };
      } else if (file.mimetype.includes('image')) {
        if (bytesToKbAndMb(file.size).KB > config.fileSize.image) {
          throw new ApiError(
            httpStatus.NOT_ACCEPTABLE,
            `File ${file.originalname} exceeds the size limit of ${config.fileSize.image} kb for images.`,
          );
        }
        // const imgbb = await ImgbbUploader.uploadSingleFileImgbb(file);
        // bodyData[file.fieldname] = imgbb;
        const cloudinary = await FileUploadHelper.uploadToCloudinary(file);
        bodyData[file.fieldname] = cloudinary;

        /* // if you are manual handling your response . Remember you are change imgbbUploader response
        bodyData[file.fieldname] = {
          mimetype: file.mimetype,
          filename: file.filename,
          server_url: `images/${file.filename}`,
          url: imgbb?.url,
          durl: imgbb?.delete_url,
        };
         */
      } else if (file.mimetype.includes('audio')) {
        bodyData[file.fieldname] = {
          mimetype: file.mimetype,
          filename: file.filename,
          server_url: `audios/${file.filename}`,
          platform: 'server',
        };
      } else if (file.mimetype.includes('video')) {
        //-------video--uploader--------
        // const video = await videoUploder.uploadSingleFilevideo(file);
        // bodyData[file.fieldname] = video;
        //-------------------------------
        bodyData[file.fieldname] = {
          mimetype: file.mimetype,
          filename: file.filename,
          server_url: `videos/${file.filename}`,
          platform: 'server',
        };
      } else if (file.mimetype.includes('application')) {
        bodyData[file.fieldname] = {
          mimetype: file.mimetype,
          filename: file.filename,
          server_url: `docs/${file.filename}`,
          platform: 'server',
        };
      } else {
        bodyData[file.fieldname] = {
          mimetype: file.mimetype,
          filename: file.filename,
          server_url: `others/${file.filename}`,
          platform: 'server',
        };
      }
      req.body = bodyData;
    } else if (req.files) {
      // console.log(req.files, 'req.files');
      if (req.files instanceof Array && req.files?.length) {
        //---imagbb---
        let images: IMulterUploadFile[] = [];
        // let videos: IMulterUploadFile[] = [];
        const other: IMulterUploadFile[] = [];
        req.files.forEach((file: IMulterUploadFile) => {
          if (file.mimetype.includes('image')) {
            if (bytesToKbAndMb(file.size).KB > config.fileSize.image) {
              throw new ApiError(
                httpStatus.NOT_ACCEPTABLE,
                `File ${file.originalname} exceeds the size limit of ${config.fileSize.image} kb for images.`,
              );
            }
            images.push(file);
          }
          // else if (file.mimetype.includes('video')) {
          //    videos.push(file);
          // }
          else {
            other.push(file);
          }
        });
        if (images.length) {
          // images = await ImgbbUploader.uploadMultipleFileImgbb(images);
          images = (await FileUploadHelper.uploadToCloudinaryMultiple(
            images,
          )) as any;
        }
        // if(videos.length){
        //   videos = await videoUploder.uploadMultipleFileImgbb(videos);
        // }
        const allModifyFiles = [...images, ...other];
        const obj: Record<string, any[]> = {};
        allModifyFiles.forEach((file: IMulterUploadFile) => {
          if (
            req?.body[file.fieldname] instanceof Array &&
            !obj[file.fieldname]
          ) {
            // for update--> when first time has some image then set default value
            obj[file.fieldname] = req['body'][file.fieldname];
          } else if (!obj[file.fieldname]?.length) {
            obj[file.fieldname] = [];
          }
          // console.log(allModifyFiles, 'allModifyFiles');
          if (file?.mimetype?.includes('image')) {
            // console.log(file, 'file dd');
            //@ts-ignore
            if (file?.url) {
              obj[file.fieldname].push(file); // when image not upload imgbb then comment it
            } else {
              // when image not upload imgbb then un comment it
              obj[file.fieldname].push({
                mimetype: file.mimetype,
                filename: file.filename,
                server_url: `images/${file.filename}`,
                platform: 'server',
              });
            }
          } else if (file.mimetype.includes('pdf')) {
            //@ts-ignore
            if (file?.url) {
              obj[file.fieldname].push(file); // when image not upload imgbb then comment it
            } else {
              // when image not upload imgbb then un comment it
              obj[file.fieldname].push({
                mimetype: file.mimetype,
                filename: file.filename,
                server_url: `pdfs/${file.filename}`,
                platform: 'server',
              });
            }
          } else if (file.mimetype.includes('audio')) {
            //@ts-ignore
            if (file?.url) {
              obj[file.fieldname].push(file); // when image not upload imgbb then comment it
            } else {
              // when image not upload imgbb then un comment it
              obj[file.fieldname].push({
                mimetype: file.mimetype,
                filename: file.filename,
                server_url: `audios/${file.filename}`,
                platform: 'server',
              });
            }
          } else if (file.mimetype.includes('video')) {
            //@ts-ignore
            if (file?.url) {
              obj[file.fieldname].push(file); // when image not upload imgbb then comment it
            } else {
              // when image not upload imgbb then un comment it
              obj[file.fieldname].push({
                mimetype: file.mimetype,
                filename: file.filename,
                server_url: `videos/${file.filename}`,
                platform: 'server',
              });
            }
          } else if (file.mimetype.includes('application')) {
            //@ts-ignore
            if (file?.url) {
              obj[file.fieldname].push(file); // when image not upload imgbb then comment it
            } else {
              // when image not upload imgbb then un comment it
              obj[file.fieldname].push({
                mimetype: file.mimetype,
                filename: file.filename,
                server_url: `docs/${file.filename}`,
                platform: 'server',
              });
            }
          } else {
            obj[file.fieldname].push({
              mimetype: file.mimetype,
              filename: file.filename,
              server_url: `others/${file.filename}`,
              platform: 'server',
            });
          }
        });

        Object.entries(obj).forEach(([key, value]) => {
          req.body[key] = value;
        });
        console.log(req.body, 'req.body');
      } else {
        //field type object in fields array
        const bodyData = { ...req.body };

        // const additionalFieldsAdd: any = req.files;
        const additionalFieldsAdd: any = {}; // When not use only image fields uploaded imgBB
        //!------------------start of imgbbFunctions----------
        Object.entries(req.files).forEach(
          ([key, _value]: [string, IMulterUploadFile[]]) => {
            additionalFieldsAdd[key] = _value.filter(
              file => !file.mimetype.includes('image'),
            );

            additionalFieldsAdd[`${key}_images`] = _value.filter(file => {
              if (file.mimetype.includes('image')) {
                if (bytesToKbAndMb(file.size).KB > config.fileSize.image) {
                  throw new ApiError(
                    httpStatus.NOT_ACCEPTABLE,
                    `File ${file.originalname} exceeds the size limit of ${config.fileSize.image} kb for images.`,
                  );
                }
                return file;
              }
            });
          },
        );
        // console.log("🚀 ~ RequestToFileDecodeAddBodyHandle ~ additionalFieldsAdd:", additionalFieldsAdd)
        try {
          const uploadPromises = Object.entries(additionalFieldsAdd).map(
            ([key, value]: [string, any]) => {
              if (key.includes('_images')) {
                return new Promise((resolve, reject) => {
                  FileUploadHelper.uploadToCloudinaryMultiple(value)
                    .then(res => {
                      return resolve({ fieldname: key, values: res });
                    })
                    .catch(err => reject(err));
                  // ImgbbUploader.uploadMultipleFileImgbb(value)
                  //   .then(res => {
                  //     return resolve({ fieldname: key, values: res });
                  //   })
                  //   .catch(err => reject(err));
                });
              }
            },
          );
          const fileResult = await Promise.all(uploadPromises);

          fileResult.forEach((value: any) => {
            if (value?.fieldname) {
              additionalFieldsAdd[value.fieldname] = value.values;
            }
          });
          Object.entries(additionalFieldsAdd).forEach(([key, images]) => {
            if (key.includes('_images')) {
              const replaceKey = key.replace('_images', ''); // Get the key without the '_images' suffix
              const anotherMineTypeData = additionalFieldsAdd[replaceKey];
              if (
                Array.isArray(anotherMineTypeData) &&
                anotherMineTypeData.length
              ) {
                // If the array exists, merge the two arrays
                additionalFieldsAdd[replaceKey] = [
                  ...anotherMineTypeData,
                  ...additionalFieldsAdd[key],
                ];
              } else {
                // If the array doesn't exist, create a new one with the contents of the original array
                additionalFieldsAdd[replaceKey] = additionalFieldsAdd[key];
              }
              // Delete the original key
              delete additionalFieldsAdd[key];
            }
            /*
              else if (key.includes('_videos')) {
              const replaceKey = key.replace('_videos', ''); // Get the key without the '_images' suffix
              const anotherMineTypeData = additionalFieldsAdd[replaceKey];
              if (
                Array.isArray(anotherMineTypeData) &&
                anotherMineTypeData.length
              ) {
                // If the array exists, merge the two arrays
                additionalFieldsAdd[replaceKey] = [
                  ...anotherMineTypeData,
                  ...additionalFieldsAdd[key],
                ];
              } else {
                // If the array doesn't exist, create a new one with the contents of the original array
                additionalFieldsAdd[replaceKey] = additionalFieldsAdd[key];
              }
              // Delete the original key
              delete additionalFieldsAdd[key];
            }
             */
          });
        } catch (error: any) {
          throw new ApiError(404, error?.message || 'File request failed');
        }
        //!--------------------end of imgbbFunctions------------

        Object.entries(additionalFieldsAdd as Record<string, any>).forEach(
          ([key, _value]: [
            string,
            IFileAfterUpload[] | IMulterUploadFile[],
          ]) => {
            if (key && _value instanceof Array) {
              // console.log('🚀 ~ RequestToFileDecodeAddBodyHandle ~ key:', key);
              let previousData = []; // for update--> when first time some image then set default value

              if (bodyData[key] instanceof Array) {
                previousData = bodyData[key];
              }
              // console.log(previousData);
              const currentData = _value?.map(
                (file: IFileAfterUpload | IMulterUploadFile | any) => {
                  if (file.mimetype.includes('image')) {
                    return file?.url
                      ? file
                      : {
                          mimetype: file?.mimetype,
                          filename: file?.filename,
                          server_url: `images/${file?.filename}`,
                          platform: 'server',
                        };
                  } else if (file.mimetype.includes('pdf')) {
                    return file?.url
                      ? file
                      : {
                          mimetype: file?.mimetype,
                          filename: file?.filename,
                          server_url: `pdfs/${file?.filename}`,
                          platform: 'server',
                        };
                  } else if (file.mimetype.includes('audio')) {
                    return file?.url
                      ? file
                      : {
                          mimetype: file?.mimetype,
                          filename: file?.filename,
                          server_url: `audios/${file?.filename}`,
                          platform: 'server',
                        };
                  } else if (file.mimetype.includes('video')) {
                    return file?.url
                      ? file
                      : {
                          mimetype: file?.mimetype,
                          filename: file?.filename,
                          server_url: `videos/${file?.filename}`,
                          platform: 'server',
                        };
                  } else if (file.mimetype.includes('application')) {
                    return file?.url
                      ? file
                      : {
                          mimetype: file?.mimetype,
                          filename: file?.filename,
                          server_url: `docs/${file?.filename}`,
                          platform: 'server',
                        };
                  } else {
                    return file?.url
                      ? file
                      : {
                          mimetype: file?.mimetype,
                          filename: file?.filename,
                          server_url: `others/${file?.filename}`,
                          platform: 'server',
                        };
                  }
                },
              );

              bodyData[key] = [...previousData, ...currentData];
            }
          },
        );
        req.body = bodyData;
      }
    }
    // requestToDeleteFile(req);
  } catch (error: any) {
    throw new ApiError(400, error?.message || 'Invalid Set body value');
  }
};

// uploadAwsS3Bucket --> utls.aws.ts in
export const RequestTo_Aws_Multer_FileDecodeAddBodyHandle = async (
  req: Request,
) => {
  try {
    const file = req.file as unknown as IAws_MulterUploadFile;
    // console.log('🚀 ~ file:', file);
    // const d = new makeImage(file);
    // after any file is object

    if (file?.originalname) {
      const bodyData = { ...req.body };
      bodyData[file.fieldname] = {
        mimetype: file.mimetype,
        filename: file.originalname,
        path: file.key,
        url: file.location,
        cdn: config.aws.s3.cloudfrontCDN,
        platform: 'aws',
      } as IFileAfterUpload;

      req.body = bodyData;
    } else if (req.files) {
      // console.log(req.files, 'req.files');
      if (req.files instanceof Array && req.files?.length) {
        const obj: Record<string, IFileAfterUpload[]> = {};
        //@ts-ignore
        req.files.forEach((file: IAws_MulterUploadFile) => {
          if (
            req?.body[file.fieldname] instanceof Array &&
            !obj[file.fieldname]
          ) {
            // for update--> when first time has some image then set default value
            obj[file.fieldname] = req['body'][file.fieldname];
          } else if (!obj[file.fieldname]?.length) {
            obj[file.fieldname] = [];
          }

          obj[file.fieldname].push({
            mimetype: file.mimetype,
            filename: file.originalname,
            path: file.key,
            url: file.location,
            cdn: config.aws.s3.cloudfrontCDN,
            platform: 'aws',
          });
        });

        Object.entries(obj).forEach(([key, value]) => {
          req.body[key] = value;
        });
      } else {
        //field type object in fields array
        const bodyData = { ...req.body };

        Object.entries(req.files as Record<string, any>).forEach(
          ([key, _value]: [string, IAws_MulterUploadFile[]]) => {
            if (key && _value instanceof Array) {
              // console.log('🚀 ~ RequestToFileDecodeAddBodyHandle ~ key:', key);
              let previousData = []; // for update--> when first time some image then set default value

              if (bodyData[key] instanceof Array) {
                previousData = bodyData[key];
              }
              // console.log(previousData);
              const currentData = _value?.map(
                (file: IAws_MulterUploadFile) => ({
                  mimetype: file.mimetype,
                  filename: file.originalname,
                  path: file.key,
                  url: file.location,
                  cdn: config.aws.s3.cloudfrontCDN,
                  platform: 'aws',
                }),
              );

              bodyData[key] = [...previousData, ...currentData];
            }
          },
        );
        req.body = bodyData;
      }
    }
    // requestToDeleteFile(req);
  } catch (error: any) {
    throw new ApiError(400, error?.message || 'Invalid Set body value');
  }
};
