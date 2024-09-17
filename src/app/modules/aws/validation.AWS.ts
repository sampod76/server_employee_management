import { z } from 'zod';

export const sign_url_property = z.object({
  filename: z.string({
    required_error: 'filename is required',
  }),
  mimetype: z.string({
    required_error: 'mimetype is required',
  }),
  uid: z.string().optional(),
});
// not need typescript in type change use
export const createAwsUploadFilesTokenBody = z.object({
  image: sign_url_property.optional(),
  images: z.array(sign_url_property).optional(),
  documents: z.array(sign_url_property).optional(),
  certificateDocuments: z.array(sign_url_property).optional(),
  nidOrPassportDocuments: z.array(sign_url_property).optional(),
});

const createAwsUploadFilesToken = z.object({
  body: createAwsUploadFilesTokenBody.refine(
    data => {
      // Check if at least one of the properties (image or images) is provided
      /* 
      if (
        data.image !== undefined ||
        (data.images !== undefined && data.images.length > 0) ||
        (data.documents !== undefined && data.documents.length > 0)
      ){
        throw new ApiError(500, 'At least one property (image or images or documents) must be provided');
      }
       */

      return (
        data.image !== undefined ||
        (data.images !== undefined && data.images.length > 0) ||
        (data.documents !== undefined && data.documents.length > 0) ||
        (data.nidOrPassportDocuments !== undefined &&
          data.nidOrPassportDocuments.length > 0) ||
        (data.certificateDocuments !== undefined &&
          data.certificateDocuments.length > 0)
      );
      // return true //if any condition to return true then success
      // return false // if any condition to return false then failure and call next error message
    },
    {
      message:
        'At least one property (image or images or documents ,nidOrPassportDocuments ,certificateDocuments) must be provided',
      path: ['body'],
    },
  ),
});

export const AWSValidation = {
  createAwsUploadFilesToken,
};
