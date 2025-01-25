/* eslint-disable @typescript-eslint/ban-ts-comment */
import mongoose from 'mongoose';
import app from './app';

// import { errorLogger, logger } from './app/share/logger';
import 'colors';
import { NextFunction } from 'express';
import http, { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import { kafkaInit } from './app/kafka/kafka';
import { RedisRunFunction } from './app/redis/service.redis';
import { errorLogger, logger } from './app/share/logger';
import config from './config/index';
import socketConnection from './sockit';

mongoose.set('strictQuery', false);
process.on('uncaughtException', error => {
  config.env === 'production'
    ? errorLogger.error(error)
    : console.log('uncaugthException is detected ......', error);
  process.exit(1);
});
// database connection

let server: Server; // এটা তারা বুঝায় সার্ভার কোন এক্টিভিটি আছে কিনা

// const httpServer = http.createServer(app);
const httpServer = http.createServer(); // ! are you use multiple connections 1. server is run 5000 port -> socket is run 5001 then use
// Create Redis clients using ioredis

const io = new SocketServer(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: true,
    // origin:
    //   config.env === 'development'
    //     ? [
    //         'http://localhost:3000',
    //         'http://127.0.0.1:3000',
    //         'http://192.168.0.101:3000',
    //       ]
    //     : ['https://iblossohimlearn.org'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  // adapter: createAdapter(pubClient, subClient),
});
// const redisClient = new Cluster([
//   { host: 'localhost', port: 7001 },
//   { host: 'localhost', port: 7002 },
//   { host: 'localhost', port: 7003 },
//   { host: 'localhost', port: 7004 },
//   { host: 'localhost', port: 7005 },
//   { host: 'localhost', port: 7006 },
// ]);

io.engine.use((req: Request, res: Response, next: NextFunction) => {
  try {
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//
// io.adapter(createAdapter(redisClient));
//

async function connection() {
  try {
    await mongoose.connect(config.database_url as string);
    config.env === 'production'
      ? logger.info(
          `Database connection successful-${config.database_url}`.green
            .underline.bold,
        )
      : console.log(`Database connection successful`.green.underline.bold);

    // ! are you use multiple connections 1. server is run 5000 port -> socket is run 5001 then use

    server = app.listen(config.port, (): void => {
      config.env === 'production'
        ? logger.info(
            `Server is listening on port ${config.port}`.blue.underline.bold,
          )
        : console.log(
            `Server is listening on port ${config.port}`.blue.underline.bold,
          );
    });

    httpServer.listen(config.socketPort, (): void => {
      config.env === 'production'
        ? logger.info(
            `socket is listening on port ${config.socketPort}`.red.underline
              .bold,
          )
        : console.log(
            `socket is listening on port ${config.socketPort}`.red.underline
              .bold,
          );
    });
    //!------Redis-------
    // const sub = await subRedis.subscribe(...subscribeArray);
    // console.log('🚀 ~ RedisRunFunction ~ sub:', sub);
    await RedisRunFunction();
    //!-------- socket connection---------
    await socketConnection(io);
    //!-----kafka--init----
    await kafkaInit();
    //!-------- backup-------
    // RunBackup();
  } catch (error) {
    config.env === 'production'
      ? errorLogger.error(`Failed to connect database: ${error}`.red.bold)
      : console.log(`Failed to connect database: ${error}`.red.bold);
  }

  process.on('unhandledRejection', error => {
    if (server) {
      server.close(() => {
        config.env === 'production'
          ? errorLogger.error(error)
          : console.log(error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}
connection();

process.on('SIGTERM', () => {
  config.env === 'production'
    ? errorLogger.error(`SIGTERM Error .....`.red.bold)
    : console.log(`SIGTERM Error .....`.red.bold);
  if (server) {
    server.close();
  }
});
