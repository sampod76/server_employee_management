/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import helmet from 'helmet';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { produceMessageByKafka } from './app/kafka/producer.kafka';
import { IUserRef } from './app/modules/allUser/typesAndConst';
import { IFriendShip } from './app/modules/friendship/friendship.interface';
import { FriendShip } from './app/modules/friendship/friendship.models';
import { IChatMessage } from './app/modules/message/messages.interface';
import { ENUM_REDIS_KEY } from './app/redis/consent.redis';
import { redisClient } from './app/redis/redis';
import { findAllSocketsIdsFromUserId } from './app/redis/service.redis';
import { logger } from './app/share/logger';
import { yourAreOnlineOffline } from './app/socket/socket.service';
import { ENUM_SOCKET_EMIT_ON_TYPE } from './app/socket/socketTypes';
import config from './config';
import { ENUM_YN } from './global/enum_constant_type';
import { jwtHelpers } from './helper/jwtHelpers';

const socketConnection = async (socketServer: Server) => {
  try {
    /* 
by default io.of('/) . this case optional user-namespace
use direct connection --> io.on('connection',socket => {
   socket.on('disconnect', async() => {
        const userData =await User.findByIdAndUpdate(user.userId, {is_online:ENUM_YN.NO})
      });
})
 */
    socketServer.use(async (socket, next) => {
      try {
        // const accessToken = socket.handshake.auth.accessToken;//front-end to send auth  in accessToken;
        const accessToken = socket.handshake.headers.authorization; //front-end to send extraHeaders in token;
        // console.log('🚀 ~ usp1.on ~ accessToken:', accessToken);
        if (!accessToken) {
          return socket.emit('error', {
            success: false,
            statusCode: 404,
            message: 'Unauthorize access token',
          });
          // throw new ApiError(400, 'forbidden access token');
        }
        // const user ={id:"dd"}
        const user = jwtHelpers.verifyToken(
          accessToken as string,
          config.jwt.secret as string,
        );
        if (!user.userId) {
          return socket.emit('error', {
            success: false,
            statusCode: 403,
            message: 'forbidden',
          });
        }
        //@ts-ignore
        socket.user = user;
      } catch (error: any) {
        next(new Error(error?.message || 'something went wrong'));
      }
    });
    socketServer.engine.use(helmet());
    // const usp1 = socketServer.of('/socket'); //socket connection -->http://localhost:5000/socket
    const usp1 = socketServer.of('/'); //socket connection -->http://localhost:5000
    usp1.on('connection', async (socket: Socket) => {
      try {
        //@ts-ignore
        const user = socket?.user as JwtPayload | IUserRef;
        console.log('🚀 ~ usp1.on ~ user:', user);
        //?--------socket --connection --stablish-----------------
        socket.emit(
          'connection',
          {
            success: true,
            message: 'Socket connection established',
            data: socket?.id,
          },
          async (clientResponse: any) => {
            // console.log('🚀 ~ clientResponse:', clientResponse);
            await redisClient.set(
              ENUM_REDIS_KEY.socket_user + user.userId + ':' + socket.id,
              JSON.stringify({
                ...user,
                socketId: socket.id as string,
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
          console.log('🚀 ~ socket.on ~ data:', data);
          await redisClient.set(
            ENUM_REDIS_KEY.socket_user + user.userId + ':' + socket.id,
            JSON.stringify({
              ...user,
              socketId: socket.id as string,
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

        //?-------------------- end ----------------------------
        //

        //?------chat message---start ----------------------------
        socket.on(
          ENUM_SOCKET_EMIT_ON_TYPE.CLIENT_TO_SERVER_PERSONAL_MESSAGE,
          async (
            messageData: IChatMessage & { friendShipId: string },
            callback: any,
          ) => {
            if (messageData?.friendShipId) {
              console.log('🚀 ~ usp1.on ~ messageData:', messageData);
              messageData.sender = {
                role: user.role,
                userId: user.userId,
                roleBaseUserId: user.roleBaseUserId,
              };
              let getFriendShip = (await redisClient.get(
                ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP +
                  messageData?.friendShipId,
              )) as null | IFriendShip;

              //

              if (!getFriendShip) {
                getFriendShip = (await FriendShip.findById(
                  messageData?.friendShipId,
                )) as IFriendShip;

                if (getFriendShip) {
                  await redisClient.set(
                    ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP +
                      messageData?.friendShipId,
                    JSON.stringify(getFriendShip),
                    'EX',
                    24 * 60, // 1 day to second
                  );
                } else {
                  socket.emit('message', {
                    success: false,
                    statusCode: 404,
                    message: 'Friendship not found',
                  });
                  return;
                }
              }

              //
              if (typeof getFriendShip === 'string') {
                getFriendShip = JSON.parse(getFriendShip);
              }
              //!-------------auth--message-----------
              if (
                getFriendShip &&
                !getFriendShip.receiver.userId === user.userId &&
                !getFriendShip.sender.userId === user.userId
              ) {
                socket.emit('error', {
                  success: false,
                  statusCode: httpStatus.FORBIDDEN,
                  message: 'Forbidden',
                });
                return;
              } else if (getFriendShip?.requestAccept !== ENUM_YN.YES) {
                socket.emit('error', {
                  success: false,
                  statusCode: httpStatus.FORBIDDEN,
                  message: 'You are not allowed to send message',
                });
                return;
              } else if (getFriendShip?.block?.isBlock == ENUM_YN.YES) {
                socket.emit('error', {
                  success: false,
                  statusCode: httpStatus.FORBIDDEN,
                  message: 'Block. you are not allowed to send message',
                });
                return;
              } else if (getFriendShip) {
                messageData.receiver =
                  getFriendShip?.sender?.userId !== user.userId
                    ? getFriendShip?.sender
                    : getFriendShip?.receiver;
              }

              //---------web or nodejs is support callback but flutter not support callback--then when request flutter then not have any callback function but same project request web --solution is check callback is function--------
              if (callback && typeof callback === 'function') {
                callback({
                  success: true,
                  message: 'Message delivered successfully',
                  data: {
                    ...messageData,
                    createdAt: new Date(Date.now()),
                    updateAt: new Date(Date.now()),
                  },
                });
                //
              } else {
                //!--- only flutter -- because flutter is not supported callback
                socket.emit(
                  ENUM_SOCKET_EMIT_ON_TYPE.CLIENT_TO_SERVER_PERSONAL_MESSAGE,
                  {
                    success: true,
                    // message: 'Message delivered successfully',
                    data: {
                      ...messageData,
                      createdAt: new Date(Date.now()),
                      updateAt: new Date(Date.now()),
                    },
                  },
                );
              }

              // your single friend is running multiple devices in run same id. then all device in send message .
              const findSocketIds = await findAllSocketsIdsFromUserId(
                messageData.receiver.userId.toString(),
              );
              console.log('🚀 ~ usp1.on ~ findSocketIds:', findSocketIds);

              if (findSocketIds?.length) {
                socket
                  .to(findSocketIds) //[]
                  .emit(
                    ENUM_SOCKET_EMIT_ON_TYPE.SERVER_TO_CLIENT_PERSONAL_MESSAGE +
                      getFriendShip._id,
                    {
                      success: true,
                      // message: 'Message delivered successfully',
                      data: {
                        ...messageData,
                        createdAt: new Date(Date.now()),
                        updatedAt: new Date(Date.now()),
                      },
                    },
                  );
                // when you message then your friend is chat another friend , then his friendship show  top list your name
                socket
                  .to(findSocketIds)
                  .emit(ENUM_SOCKET_EMIT_ON_TYPE.LATEST_FRIEND, {
                    // this is listen friend ship list
                    success: true,
                    message: 'Last message deliver friend',
                    data: {
                      ...getFriendShip,
                      lastMessage: {
                        message: messageData.message,
                        createdAt: new Date(Date.now()),
                      },
                      createdAt: new Date(Date.now()),
                      updateAt: new Date(Date.now()),
                    },
                  });
              }

              // await pubRedis.publish(
              //   ENUM_REDIS_SUBSCRIBE.socket_message,
              //   JSON.stringify(messageData),
              // );

              await produceMessageByKafka(JSON.stringify(messageData));
            } else {
              socket.emit('error', {
                success: false,
                statusCode: 404,
                message: 'friendShipId id not found',
              });
              return;
            }
          },
        );
        //?------end message-------------------

        socket.on('disconnect', async () => {
          try {
            const getUsers = await redisClient.keys(
              ENUM_REDIS_KEY.socket_user + user.userId + '*',
            );
            //console.log('🚀 ~ socket.on ~ getUsers:', getUsers); //� ~ getKeys: ['socket:user:6667fbeb12ad156c0ddb4dd5:yiTdeQVOPKSXRcLqAAAD','socket:user:6667fbeb12ad156c0ddb4dd5:GNqB3qX420mO_qqUAAAC']
            let deleteKeys = '';
            if (getUsers?.length) {
              for (let i = 0; i < getUsers.length; i++) {
                // const socketId = getUsers[i].split(':')[3];
                // console.log('🚀 ~ socket.on ~ socketId:', socketId);//6s5sTDgvDyeccoj8AAAB
                if (getUsers[i].includes(socket.id)) {
                  deleteKeys = getUsers[i];
                  break;
                }
              }
            }
            if (deleteKeys) {
              console.log('🚀 ~ socket.on ~ deleteKeys:'.bgRed, deleteKeys);
              //which person is multiple device is run but when is all device is offline then show offline
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
            socket.emit('error', {
              success: false,
              statusCode: 404,
              message: error?.message || 'Server error',
              error,
            });
            return;
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: any) {
        // console.log(error);
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
    global.socketIo = socketServer;
  } catch (error) {
    // console.log(error);
    logger.error(JSON.stringify(error));
  }
};

export default socketConnection;
