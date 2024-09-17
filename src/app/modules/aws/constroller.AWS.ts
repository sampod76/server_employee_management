/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
// import { globalImport } from '../../../import/global_Import';
// import ApiError from '../../errors/ApiError';
import {
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3';
import config from '../../../config';
import catchAsync from '../../share/catchAsync';
import sendResponse from '../../share/sendResponse';
import { IAwsBodyData } from './interface.AWS';
import { AWSService } from './service.AWS';
import { getAccessPrivateObjectUrl, s3Client } from './utls.aws';

const createAwsUploadFilesToken = catchAsync(
  async (req: Request, res: Response) => {
    const body = req.body as IAwsBodyData;

    const asyncResponse = await AWSService.createAwsUploadFilesTokenFromDb(
      body,
      req,
    );

    sendResponse<any>(req, res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'successful create AWS',
      data: asyncResponse,
    });
  },
);

const getPrivetAwsFileToken = catchAsync(
  async (req: Request, res: Response) => {
    const response = await getAccessPrivateObjectUrl(
      req.params.filename || 'upload/images/file_example_JPG_100kB.jpg',
    );

    sendResponse<any>(req, res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'successful get AWS',
      data: response,
    });
  },
);
const getFiles = catchAsync(async (req: Request, res: Response) => {
  //  console.log(req.query.continuationToken); //1 DMBufoyTXlHp0UTXdkLyFsP722G3 t2GPB1AnySKVdqRDG0UzMihyk8RoCWzd8gvYUrq/Ea6UsNQXXfe4kpsTo9wJBUqZmE -->//!- this is many white spaces
  const continuationToken =
    typeof req.query.continuationToken === 'string'
      ? req.query.continuationToken.split(' ').join('+') //!- this is many white spaces remove and add (+)
      : undefined;

  // Define the parameters for S3 listObjectsV2
  const params: ListObjectsV2CommandInput = {
    Bucket: config.aws.s3.bucket as string, // Ensure this is correctly defined
    Prefix: 'upload/images/', // Ensure this is correct
    MaxKeys: 10,
    ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
  };
  const command = new ListObjectsV2Command(params);
  const data = await s3Client.send(command);
  sendResponse<any>(req, res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'successful get AWS',
    data: data,
  });

  /* 
  {
    "statusCode": 200,
    "success": true,
    "message": "successful get AWS",
    "data": {
        "$metadata": {
            "httpStatusCode": 200,
            "requestId": "NQVDMAP5BHZPN0B9",
            "extendedRequestId": "Y+mdCauSeyqDgMUFSrNLuzAARwmMjs6k8k4G1W9R1N++r8n3hAO6eZALunz2cKBv9tb1hPf2Mwc=",
            "attempts": 1,
            "totalRetryDelay": 0
        },
        "Contents": [
            {
                "Key": "upload/images/1000002003-1720877752756.jpg",
                "LastModified": "2024-07-13T13:35:56.000Z",
                "ETag": "\"526bc9fbc2e67678cde86c2ecdbd1e67\"",
                "Size": 3448799,
                "StorageClass": "STANDARD"
            },
            {
                "Key": "upload/images/1000002003-1720877841291.jpg",
                "LastModified": "2024-07-13T13:37:25.000Z",
                "ETag": "\"526bc9fbc2e67678cde86c2ecdbd1e67\"",
                "Size": 3448799,
                "StorageClass": "STANDARD"
            },
            {
                "Key": "upload/images/1000002003-1720877907182.jpg",
                "LastModified": "2024-07-13T13:38:31.000Z",
                "ETag": "\"526bc9fbc2e67678cde86c2ecdbd1e67\"",
                "Size": 3448799,
                "StorageClass": "STANDARD"
            },
            {
                "Key": "upload/images/1000002003-1720877909532.jpg",
                "LastModified": "2024-07-13T13:38:32.000Z",
                "ETag": "\"526bc9fbc2e67678cde86c2ecdbd1e67\"",
                "Size": 3448799,
                "StorageClass": "STANDARD"
            },
            {
                "Key": "upload/images/1000002003-1720877951773.jpg",
                "LastModified": "2024-07-13T13:39:15.000Z",
                "ETag": "\"526bc9fbc2e67678cde86c2ecdbd1e67\"",
                "Size": 3448799,
                "StorageClass": "STANDARD"
            },
            {
                "Key": "upload/images/1000002004-1720876605682.jpg",
                "LastModified": "2024-07-13T13:16:50.000Z",
                "ETag": "\"118989ea9c9bc18268d56a54d34f2bb8\"",
                "Size": 449550,
                "StorageClass": "STANDARD"
            },
            {
                "Key": "upload/images/1000002004-1720876661065.jpg",
                "LastModified": "2024-07-13T13:17:44.000Z",
                "ETag": "\"118989ea9c9bc18268d56a54d34f2bb8\"",
                "Size": 449550,
                "StorageClass": "STANDARD"
            },
            {
                "Key": "upload/images/1000002004-1720877514678.jpg",
                "LastModified": "2024-07-13T13:31:58.000Z",
                "ETag": "\"118989ea9c9bc18268d56a54d34f2bb8\"",
                "Size": 449550,
                "StorageClass": "STANDARD"
            },
            {
                "Key": "upload/images/1000002004-1720877514722.jpg",
                "LastModified": "2024-07-13T13:31:58.000Z",
                "ETag": "\"118989ea9c9bc18268d56a54d34f2bb8\"",
                "Size": 449550,
                "StorageClass": "STANDARD"
            },
            {
                "Key": "upload/images/1000002004-1720877514871.jpg",
                "LastModified": "2024-07-13T13:31:58.000Z",
                "ETag": "\"118989ea9c9bc18268d56a54d34f2bb8\"",
                "Size": 449550,
                "StorageClass": "STANDARD"
            }
        ],
        "ContinuationToken": "1F3weZoZzVI0LtxwjTLx+Ql0pZo0dRiFOcE34BcODDBLSYmp0lkdB7pmhwJy6g1K7iP4Oev0dytZqnqmku3mHjKqTFVpE9h45",
        "IsTruncated": true,
        "KeyCount": 10,
        "MaxKeys": 10,
        "Name": "bucketdevsampod",
        "NextContinuationToken": "1Ke26rIqi7baty4pT1wyj1njPB1nHUV6BlHPhxI3pCJkMQcLDmjKYMikuzqp5WVmh4FJJqFphMrKDpYbAG1fjMzxCNY/lZrzZ",
        "Prefix": "upload/images/"
    }
}
  */
});

export const AWSController = {
  createAwsUploadFilesToken,
  getPrivetAwsFileToken,
  getFiles,
};
