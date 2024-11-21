/* eslint-disable @typescript-eslint/no-unused-vars */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';

// create xss-clean.d.ts file after work this xss
// import xss from 'xss-clean';
import httpStatus from 'http-status';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import routers from './app/routes/index_route';
//-------------configuring i18next----------
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import i18nextMiddleware from 'i18next-http-middleware';
//----------------------------------------

import compression, { CompressionOptions } from 'compression';
import file_route from './app/routes/file_route';
import config from './config';
import helmetConfig from './config/helmetConfig';
import { TestFile } from './test';
import { rateLimiterRedisMiddleware } from '@utils/DbUtlis/RateLimiterInRedis';
const app: Application = express();

app.use(helmetConfig);

// app.use(
//   cors({
//     origin:
//       config.env === 'development'
//         ? [
//             'http://localhost:3000',
//             'http://localhost:8000',
//             'http://127.0.0.1:3000',
//             'http://127.0.0.1:8000',
//             'http://192.168.10.3:8000',
//             'http://192.168.10.3:3000',
//           ]
//         : [config.client_side_url as string],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   }),
// );

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  }),
);

const compressionOptions: CompressionOptions = {
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      // Don't compress responses if this request header is present
      return false;
    }
    return compression.filter(req, res);
  },
};

// app.use(xss());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

//!-- - some time rate limited is problem my docker compose problem don't use this -->
app.use(rateLimiterRedisMiddleware);
// app.use(rateLimiterMiddlewareMongodb);
// app.use(compression());
app.use(compression(compressionOptions));
// app.use(rateLimiterRedisMiddleware);
//-------------i18next-- start ---------------
i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: './translation/{{lng}}/translation.json',
      // loadPath: __dirname + '/translation/{{lng}}/translation.json', --> not use __dirname and use (.) ->./translation
    },
    detection: {
      order: ['header'],
      caches: ['cookie'],
    },
    preload: ['en', 'fr'],
    fallbackLng: config.api_response_language, // default language en= english
  });
app.use(i18nextMiddleware.handle(i18next));
// ----------- end i18next-------------------

app.set('view engine', 'ejs');

app.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // res.render('serverCheck.ejs');
    res.send({ message: 'server is running....' + process.pid });
  } catch (error) {
    next(error);
  }
});

TestFile();
//Application route
app.use('/api/v1', routers);
app.use('/file', file_route.fileRoute);

// global error handlar
app.use(globalErrorHandler);

//handle not found route
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).send({
    success: false,
    message: 'Not found route',
    errorMessages: [
      {
        path: req.originalUrl,
        message: 'api not found',
      },
    ],
  });
  next();
});

export default app;
