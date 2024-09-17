import { z } from 'zod';
import { IFileAfterUpload } from '../../interface/fileUpload';
import {
  createAwsUploadFilesTokenBody,
  sign_url_property,
} from './validation.AWS';

export type IAwsOutputPreUrl = IFileAfterUpload & {
  pre_url: string;
  filename: string;
  modifyFileName: string;
  uid?: string;
};

export type IAwsInputFile = z.infer<typeof sign_url_property>;

export type IAwsBodyData = z.infer<typeof createAwsUploadFilesTokenBody>;
