/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { IUserRef } from './app/modules/allUser/typesAndConst';
import { ENUM_REDIS_KEY } from './app/redis/consent.redis';
import { redisClient } from './app/redis/redis';
import { logger } from './app/share/logger';
import { groupMessageSocket } from './app/socket/module/socket.groupMessage';
import { personalMessageSocket } from './app/socket/module/socket.personalMessage';
import { yourAreOnlineOffline } from './app/socket/socket.service';
import config from './config';
import { jwtHelpers } from './helper/jwtHelpers';

const socketConnection = async (io: Server) => {
  try {
    /* 
     by default io.of('/) . this case optional user-namespace
     use direct connection --> io.on('connection',socket => {
     socket.on('disconnect', async() => {
        const userData =await User.findByIdAndUpdate(user.userId, {is_online:ENUM_YN.NO})
      });
      })
    */
    // const usp1 = io.of('/socket'); //socket connection -->http://localhost:5000/socket
    const usp1 = io.of('/'); //socket connection -->http://localhost:5000
    usp1.on('connection', async (socket: Socket) => {
      const accessTokenInAuth = socket.handshake.auth.accessToken; //front-end to send auth  in accessToken;
      const accessTokenInHeader = socket.handshake.headers.authorization; //front-end to send extraHeaders in token;
      const getToken = accessTokenInAuth || accessTokenInHeader;
      if (!getToken) {
        return socket.emit('error', {
          success: false,
          statusCode: 401,
          message: 'Unauthorize access token',
        });
        // throw new ApiError(400, 'forbidden access token');
      }
      let user: JwtPayload | IUserRef;
      try {
        user = jwtHelpers.verifyToken(
          getToken as string,
          config.jwt.secret as string,
        );

        // if (!user.userId) {
        //   return socket.emit('error', {
        //     success: false,
        //     statusCode: 401,
        //     message: 'forbidden',
        //   });
        // }
        //
        //@ts-ignore
        socket.user = user;

        //?--------socket --connection --stablish-----------------
        socket.emit(
          'connection',
          {
            success: true,
            message: 'Socket connection established',
            data: socket?.id,
          },
          async (clientResponse: any) => {
            // console.log(
            //   'socket connection established:' + socket.id + ''.bgGreen,
            // );

            logger.info('socket connection established' + socket.id);

            await redisClient.set(
              ENUM_REDIS_KEY.socket_user + user.userId + ':' + socket.id,
              JSON.stringify({
                ...user,
                socketId: socket.id as string,
                token: getToken,
              }),
            );

            // all active friend chat you . then inform your are online or offline
            await yourAreOnlineOffline(user.userId, {
              // online offline socket events
              success: true,
              message: 'User is online',
              data: {
                isOnline: true,
                socketStatus: 'online', // use only flutter app
                user: user as IUserRef,
              },
            });
          },
        );
        //!--only use flutter_app --because nodejs server is support callback but flutter is not support callback
        socket.on('connection', async (data: any) => {
          await redisClient.set(
            ENUM_REDIS_KEY.socket_user + user.userId + ':' + socket.id,
            JSON.stringify({
              ...user,
              socketId: socket.id as string,
              token: getToken,
            }),
          );
          // all active friend chat you . then inform your are online or offline
          await yourAreOnlineOffline(user.userId, {
            success: true,
            message: 'User is online',
            data: {
              isOnline: true,
              socketStatus: 'online', // use only flutter app
              user: user as IUserRef,
            },
          });
        });
        //?-************chat message---start ************
        personalMessageSocket(io, socket, {
          ...user,
          token: getToken,
        } as IUserRef & {
          token: string;
        });
        //?-****************end message****************

        //?- ***************Group message*****************
        groupMessageSocket(io, socket, {
          ...user,
          token: getToken,
        } as IUserRef & {
          token: string;
        });
        //?- ************Group end**************

        socket.on('disconnect', async () => {
          try {
            const [getUsers] = await Promise.all([
              redisClient.keys(ENUM_REDIS_KEY.socket_user + user.userId + '*'),
              // redisClient.del(ENUM_REDIS_KEY.socket_id_in_token + socket.id),
            ]);
            let deleteKeys = '';
            if (getUsers?.length) {
              const matchedKey = getUsers.find(key => key.includes(socket.id));
              if (matchedKey) {
                deleteKeys = matchedKey;
              }
            }
            if (deleteKeys) {
              //The same person can login from multiple devices and show only his users offline when he is logged out from all devices.
              await redisClient.del(deleteKeys);
              if (getUsers?.length < 2) {
                //SOCKET event
                await yourAreOnlineOffline(deleteKeys.split(':')[2], {
                  success: true,
                  message: 'User is offline',
                  data: {
                    isOnline: false,
                    socketStatus: 'offline', // use only flutter app
                    user: user as IUserRef,
                  },
                });
              }
            }
          } catch (error: any) {
            logger.error(JSON.stringify(error));
            // socket.emit('error', {
            //   success: false,
            //   statusCode: 404,
            //   message: error?.message || 'Server error',
            //   error,
            // });
            // return;
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: any) {
        logger.error(JSON.stringify(error));
        socket.emit('error', {
          success: false,
          statusCode: 404,
          message: error?.message || 'Server error',
          error,
        });
        return;
      }
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    global.socketIo = io;
  } catch (error) {
    logger.error(JSON.stringify(error));
  }
};

export default socketConnection;

// const user ={id:"dd"}
// const getTokenInfo = await redisClient.get(
//   ENUM_REDIS_KEY.socket_id_in_token + getToken,
// );
// let decode;
// if (getTokenInfo) {
//   decode = JSON.parse(getTokenInfo);
// }
// if (decode?.token) {
//   //?when not same token then
//   if (decode.token !== getToken) {
//     try {
//       user = jwtHelpers.verifyToken(
//         getToken as string,
//         config.jwt.secret as string,
//       );
//       if (!user.userId) {
//         return socket.emit('error', {
//           success: false,
//           statusCode: 401,
//           message: 'forbidden',
//         });
//       }
//       await redisClient.set(
//         ENUM_REDIS_KEY.socket_id_in_token + getToken,
//         JSON.stringify({
//           ...user,
//           socketId: socket.id as string,
//           token: getToken,
//         }),
//         'EX',
//         24 * 60 * 60, // 1 day to second
//       );
//     } catch (error: any) {
//       if (error.name === 'TokenExpiredError') {
//         socket.emit('error', {
//           success: false,
//           statusCode: 403,
//           message: 'token expired',
//         });
//         socket.disconnect();
//       }
//     }
//   }
//   //?when same token then check token validity validity expair then error
//   else if (decode.exp < Date.now()) {
//     //best solution->  https://www.notion.so/sampod/socket-5987b0d838714d24ae42a1f880c788ea?pvs=4#13e7a1bce8f580bb91f1d4104f466567

//     socket.emit('error', {
//       success: false,
//       statusCode: 403,
//       message: 'token expired',
//     });
//     socket.disconnect();
//     return;
//   }
//   // pass
// } else {
//   user = jwtHelpers.verifyToken(
//     getToken as string,
//     config.jwt.secret as string,
//   );
//   await redisClient.set(
//     ENUM_REDIS_KEY.socket_id_in_token + socket.id,
//     JSON.stringify({
//       ...user,
//       socketId: socket.id as string,
//       token: getToken,
//     }),
//     'EX',
//     24 * 60 * 60, // 1 day to second
//   );
//   if (!user.userId) {
//     return socket.emit('error', {
//       success: false,
//       statusCode: 401,
//       message: 'forbidden',
//     });
//   }
// }
//
