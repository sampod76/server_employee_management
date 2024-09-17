import express from 'express';
import validateRequestZod from '../../middlewares/validateRequestZod';
import { AWSController } from './constroller.AWS';
import { AWSValidation } from './validation.AWS';
const router = express.Router();

router
  .route('/create-aws-upload-files-token')
  .post(
    validateRequestZod(AWSValidation.createAwsUploadFilesToken),
    AWSController.createAwsUploadFilesToken,
  );
router
  .route('/getPrivetAwsFile/:filename')
  .post(AWSController.getPrivetAwsFileToken);
//
router.route('/get-all-files').get(AWSController.getFiles);

export const AWSRoute = router;
