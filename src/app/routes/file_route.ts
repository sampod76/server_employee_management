/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { RequestHandler } from 'express';
import path from 'path';
import catchAsync from '../share/catchAsync';
const uploadPath = '../../../../uploadFile';
const router = express.Router();
const middlewareFunction: RequestHandler = catchAsync((req, res, next) => {
  const extractDirectoryName = (url: string) => {
    // "/file/pdfs/file-sample_150b-d.pdf"
    const match = url.match(/\/([^/]+)\/([^/]+)$/); //! get /file/(text)/file-sample_150b-d.pdf to
    //  console.log('🚀 ~ extractDirectoryName ~ match:', match);
    if (match) {
      return match[1]; // Return the matched directory name
    }
    return null; // Return null if no match is found
  };
  const getPathName = extractDirectoryName(req.originalUrl); //ans: images / pdfs /videos --get from url
  const filePath = path.resolve(
    __dirname,
    `${uploadPath}/${getPathName}/${req.params?.filename}`,
  );

  //!--- you went when any image not found then throw 404.png your custom image
  // if (!fs.existsSync(filePath)) {
  //   return res
  //     .status(200)
  //     .sendFile(path.resolve(__dirname, '../public/404.jpg'));
  // }
  if (req.query.download === 'yes') {
    return res.status(200).download(filePath);
    /* // -- second method if when not work first method then use this
      fs.promises
        .readFile(filePath)
        .then(response => {
          const contentType =
            mimeTypes.lookup(filePath) || 'application/octet-stream';
  
          res.setHeader('Content-Type', contentType);
          res.setHeader(
            'Content-Disposition',
            `attachment; filename=${req.params?.filename}`,
          );
  
          return res.status(200).end(response, 'binary');
        })
        .catch(err => {
          console.log(err);
          return res
            .status(200)
            .sendFile(path.resolve(__dirname, '../public/404.jpg'));
        }); 
        */
  } else {
    return res.status(200).sendFile(filePath);
  }
  // jwtHelpers.verifyToken(`${req.headers.authorization}`, config.jwt.secret as string);
  // console.log('first');
  // next();
});

const run: RequestHandler = (req, res, next) => {
  try {
    // jwtHelpers.verifyToken(`${req.headers.authorization}`, config.jwt.secret as string);
    // console.log('first');
    next();
  } catch (error) {
    next(error);
  }
};

router.get(
  '/images/:filename', // please set same upload folder name .
  run,
  middlewareFunction,
  // express.static(path.join(__dirname, '../../uploadFile/images/')),
);
router.get(
  '/profile/:filename', // please set same upload folder name .
  run,
  middlewareFunction,
  // express.static(path.join(__dirname, '../../uploadFile/profile/')),
);
router.get(
  '/videos/:filename', // please set same upload folder name .
  run,
  middlewareFunction,
  // express.static(path.join(__dirname, '../../uploadFile/videos/')),
);
router.get(
  '/audios/:filename', // please set same upload folder name .
  run,
  middlewareFunction,
  // express.static(path.join(__dirname, `../../uploadFile/audios/`)),
);
router.get(
  '/docs/:filename', // please set same upload folder name .
  run,
  middlewareFunction,
  // express.static(path.join(__dirname, `../../uploadFile/audios/`)),
);
router.get(
  '/pdfs/:filename', // please set same upload folder name .
  run,
  // (req, res, next) => {
  //   req.customData = { downloadType: 'pdf' };
  // },
  middlewareFunction,
  // express.static(path.join(__dirname, `../../uploadFile/pdfs/`)),
);

router.get(
  '/pdfs/:filename', // please set same upload folder name .
  run,
  // (req, res, next) => {
  //   req.customData = { downloadType: 'pdf' };
  // },
  middlewareFunction,
  // express.static(path.join(__dirname, `../../uploadFile/pdfs/`)),
);
export default { fileRoute: router };
