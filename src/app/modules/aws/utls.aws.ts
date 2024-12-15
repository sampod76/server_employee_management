/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * @use this is pre signed url -->for get -->GetObjectCommand
 * @p
 */
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import config from '../../../config';
import ApiError from '../../errors/ApiError';
import { IAwsInputFile, IAwsOutputPreUrl } from './interface.AWS';
const s3Client = new S3Client({
  region: config.aws.s3.region, //us-east-1
  credentials: {
    accessKeyId: config.aws.s3.accessKeyId as string, //AKIAsdfPsdfsdsdfGZD7NEU
    secretAccessKey: config.aws.s3.secretAccessKey as string, // 'OYdMQsdfsdfnqbID7kOCVk/ym/DDDKsfdsdfEqkP48j',
  },
});

const getAccessPrivateObjectUrl = async (
  key: string,
): Promise<string | null> => {
  const commend = new GetObjectCommand({
    Bucket: config.aws.s3.bucket as string, //'privatebucketdevsampod',
    Key: key, //"upload/image/helloImage.jpg"
  });
  //@ts-ignore
  const url = await getSignedUrl(s3Client, commend /* { expiresIn: 60 } */); // 60 seconds
  return url;
};

const putSingleImageObjectCommandToUrl = async (
  fileData: IAwsInputFile,
): Promise<IAwsOutputPreUrl> => {
  let filePath;
  // const modifyFileName = Date.now() + '-' + fileData.filename;
  const fileExt = path.extname(fileData.filename);
  const sanitizedFileName = fileData.filename
    .replace(fileExt, '') // Remove the file extension
    .toLowerCase() // Convert to lowercase
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except for spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim(); // Trim extra spaces for safety

  const modifyFileName = `${sanitizedFileName}-${Date.now()}${fileExt}`;

  if (fileData.mimetype.includes('image')) {
    filePath = `upload/images/${modifyFileName}`;
  } else if (fileData.mimetype.includes('audio')) {
    filePath = `upload/audios/${modifyFileName}`;
  } else if (fileData.mimetype.includes('video')) {
    filePath = `upload/videos/${modifyFileName}`;
  } else if (fileData.mimetype.includes('application')) {
    filePath = `upload/docs/${modifyFileName}`;
  } else if (fileData.mimetype.includes('pdf')) {
    filePath = `upload/pdfs/${modifyFileName}`;
  } else {
    filePath = `upload/others/${modifyFileName}`;
  }
  const commend = new PutObjectCommand({
    Bucket: config.aws.s3.bucket as string, //'privatebucketdevsampod',
    Key: filePath, //"upload/image/helloImage.jpg"
    ContentType: fileData.mimetype, //"image/jpeg"
  });
  //@ts-ignore
  const url = await getSignedUrl(s3Client, commend /*  { expiresIn: 10000 } */); //100
  const res: IAwsOutputPreUrl = {
    url: url.split('?')[0],
    pre_url: url,
    filename: fileData.filename,
    modifyFileName,
    mimetype: fileData.mimetype,
    uid: fileData?.uid,
    platform: 'aws',
    path: filePath,
    cdn: config.aws.s3.cloudfrontCDN,
  };
  return res;
};

const multipleImageObjectCommandToUrl = async (
  fileDataList: IAwsInputFile[],
): Promise<IAwsOutputPreUrl[] | unknown[]> => {
  const uploadPromises = fileDataList.map((value: IAwsInputFile) => {
    if (value.filename) {
      return new Promise((resolve, reject) => {
        putSingleImageObjectCommandToUrl(value)
          .then((res: IAwsOutputPreUrl) => {
            return resolve(res);
          })
          .catch(err => reject(err));
      });
    }
  });
  try {
    return await Promise.all(uploadPromises);
  } catch (error: any) {
    throw new ApiError(400, error?.message);
  }
};

/* 

*/

// Function to delete multiple files from S3
const deleteS3MultipleFiles = async (fileKeys: string[]) => {
  const params = {
    Bucket: config.aws.s3.bucket as string, // Your S3 bucket name
    Delete: {
      Objects: fileKeys.map(key => ({ Key: key })), // Array of objects with file keys
      Quiet: false, // Set to true if you don't want a list of deleted objects in the response
    },
  };

  try {
    // Use DeleteObjectsCommand for deleting multiple files
    const command = new DeleteObjectsCommand(params);
    const data = await s3Client.send(command); // Send the command using the S3Client
    // console.log('Successfully deleted files:', data.Deleted);
  } catch (err: any) {
    throw new ApiError(400, err?.message);
  }
};

// const uploadAwsS3Bucket = multer({
//   storage: multerS3({
//     s3: s3Client,
//     bucket: config.aws.s3.bucket as string, // Replace with your bucket name
//     metadata: (req: Request, file, cb) => {
//       cb(null, {
//         fieldName: file.fieldname,
//         authorUserId: req?.user?.userId || '',
//         role: req?.user?.role || '',
//       });
//     },

//     key: (req, file, cb) => {
//       const allowedMimeTypes = [
//         // 'image/jpg',
//         // 'image/png',
//         // 'image/jpeg',
//         // 'image/heic',
//         // 'image/heif',
//         // 'image/gif',
//         // 'image/avif',
//         'application/pdf',
//         'application/x-x509-ca-cert',
//         'application/octet-stream',
//         'application/pkix-cert',
//         'application/pkcs8',
//         'application/msword',
//       ];

//       if (
//         !allowedMimeTypes.includes(file.mimetype) &&
//         !file.mimetype.includes('image') // allow all image types
//       ) {
//         cb(
//           new Error(
//             'Only ' +
//               allowedMimeTypes.map(type => type.split('/')[1]).join(', ') +
//               'format is allowed!',
//           ),
//         );
//       }

//       let filePath = '';

//       const fileExt = path.extname(file.originalname);
//       const sanitizedFileName = file.originalname
//         .replace(fileExt, '') // Remove the file extension
//         .toLowerCase() // Convert to lowercase
//         .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except for spaces and hyphens
//         .replace(/\s+/g, '-') // Replace spaces with hyphens
//         .trim(); // Trim extra spaces for safety

//       const modifyFileName = `${sanitizedFileName}-${Date.now()}${fileExt}`;

//       if (file.mimetype.includes('image')) {
//         filePath = `upload/images/${modifyFileName}`;
//       } else if (file.mimetype.includes('audio')) {
//         filePath = `upload/audios/${modifyFileName}`;
//       } else if (file.mimetype.includes('video')) {
//         filePath = `upload/videos/${modifyFileName}`;
//       } else if (file.mimetype.includes('application')) {
//         filePath = `upload/docs/${modifyFileName}`;
//       } else if (file.mimetype.includes('pdf')) {
//         filePath = `upload/pdfs/${modifyFileName}`;
//       } else {
//         filePath = `upload/others/${modifyFileName}`;
//       }

//       cb(null, filePath);
//     },
//     // Add the tagging configuration here
//   }),
// });

export {
  deleteS3MultipleFiles,
  getAccessPrivateObjectUrl,
  multipleImageObjectCommandToUrl,
  putSingleImageObjectCommandToUrl,
  //
  s3Client,
};
