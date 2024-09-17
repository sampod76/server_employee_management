// import { NextFunction, Request, Response } from 'express';

// import sharp from 'sharp';
// import { unlinkFile } from '../../utils/unlinkFile';
// // const maxSize = 5 * 1024 * 1024; // 5 MB

// export const processImages = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
// //   console.log(req.files);
//   if (req.files?.length) {
//     // eslint-disable-next-line no-undef
//     const files = req.files as Express.Multer.File[];
//     // Process each uploaded image
//     files?.forEach((file: any) => {
//       if (file.mimetype.includes('image')) {
//         console.log(file);
//         // If file size is greater than 5MB, compress and convert image
//         sharp(file.path)
//           .resize({ width: 1024 }) // Resize image width to 1024px
//           .toFormat('jpeg') // Convert image to JPEG format
//           .jpeg({ quality: 100 }) // Set JPEG quality to 80%
//           .toFile(file.path.replace('.jpeg', `${Math.random()}-compressed.jpeg`), err => {
//             if (err) {
//               return next(err);
//             }
//             unlinkFile(file.path)
//           });
//         next();
//       } else {
//         next();
//       }
//     });
//   } else if (req.file?.mimetype.includes('image')) {
//     if (req.file.mimetype.includes('image')) {
//       // If file size is greater than 5MB, compress and convert image
//       sharp(req.file.path)
//         .resize({ width: 1024 }) // Resize image width to 1024px
//         .toFormat('jpeg') // Convert image to JPEG format
//         .jpeg({ quality: 100 }) // Set JPEG quality to 80%
//         .toFile(req.path.replace('.jpeg', `${Math.random()}-compressed.jpeg`),err => {
//           if (err) {
//             return next(err);
//           }
//           unlinkFile(req.path)
//           next();
//         });
//     } else {
//       next();
//     }
//   } else if (Object.entries(req.files as Record<string, any>).length) {
//     console.log("🚀 ~ req.files:", req.files)
//     Object.entries(req.files as Record<string, any>).forEach(
//       ([key, _value]: [string, any[]]) => {
//         if (key && _value instanceof Array) {
//           _value.forEach(file =>
//             sharp(file.path)
//               .resize({ width: 1024 }) // Resize image width to 1024px
//               .toFormat('jpeg') // Convert image to JPEG format
//               .jpeg({ quality: 100 }) // Set JPEG quality to 80%
//               .toFile(file.path.replace('.jpeg', `${Math.random()}-compressed.jpeg`), err => {
//                 if (err) {
//                   return next(err);
//                 }
//                 unlinkFile(file.path)
//               }),
//           );
//         }
//     },
//     );
//     next();
//   } else {
//     next();
//   }
// };
