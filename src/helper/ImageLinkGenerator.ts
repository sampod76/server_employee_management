import { IFileAfterUpload } from '../app/interface/fileUpload';
import config from '../config';

export const imageLinkGeneratorByObject = (imageObject?: IFileAfterUpload) => {
  // console.log('🚀 ~ imageLinkGeneratorByObject ~ imageObject:', imageObject);
  if (imageObject?.cdn) {
    return imageObject.cdn + '/' + imageObject.path;
  } else if (imageObject?.url) {
    return imageObject?.url;
  } else if (imageObject?.server_url) {
    return config.server_side_url + '/' + imageObject?.server_url;
  } else {
    return 'https://img.freepik.com/free-vector/404-error-with-landscape-concept-illustration_114360-7898.jpg?t=st=1718460908~exp=1718464508~hmac=0095fcbafe24741d987819f86f1e1bb481bbd57831af05dce8f950db360c873c&w=500';
  }
};
