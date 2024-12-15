import httpStatus from 'http-status';
import { Server, Socket } from 'socket.io';
import { produceMessageByKafka } from '../../kafka/producer.kafka';
import { IUserRef } from '../../modules/allUser/typesAndConst';
import { IFriendShip } from '../../modules/messageing/friendship/friendship.interface';
import { FriendShip } from '../../modules/messageing/friendship/friendship.models';
import { IChatMessage } from '../../modules/messageing/message/messages.interface';
import { ENUM_REDIS_KEY } from '../../redis/consent.redis';
import { redisClient } from '../../redis/redis';
import { findAllSocketsIdsFromUserId } from '../../redis/service.redis';
import { socketErrorHandler } from '../socket.service';
import { ENUM_SOCKET_EMIT_ON_TYPE } from '../socketTypes';
export const personalMessageSocket = (
  io: Server,
  socket: Socket,
  user: IUserRef & { token: string },
) => {
  //?------chat message---start ----------------------------
  socket.on(
    ENUM_SOCKET_EMIT_ON_TYPE.CLIENT_TO_SERVER_PERSONAL_MESSAGE,
    async (
      messageData: IChatMessage & { friendShipId: string },
      callback: any,
    ) => {
      try {
        if (messageData?.friendShipId) {
          messageData.sender = {
            role: user.role,
            userId: user.userId,
            roleBaseUserId: user.roleBaseUserId,
          };
          let getFriendShip = (await redisClient.get(
            ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP + messageData?.friendShipId,
          )) as null | IFriendShip;
          //
          if (!getFriendShip) {
            // getFriendShip = (await FriendShip.findById(
            //   messageData?.friendShipId,
            // )) as IFriendShip;
            getFriendShip = await FriendShip.isFriendShipExistMethod(
              messageData?.friendShipId,
              {
                populate: true,
                //@ts-ignore
                project: { name: 1, profileImage: 1, email: 1 },
              },
            );

            if (getFriendShip) {
              await redisClient.set(
                ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP +
                  messageData?.friendShipId,
                JSON.stringify(getFriendShip),
                'EX',
                24 * 60, // 1 day to second
              );
            } else {
              const errorMessage = {
                success: false,
                statusCode: 404,
                message: 'Friendship not found',
              };
              return socketErrorHandler({ socket, callback, errorMessage });
            }
          }

          //
          if (typeof getFriendShip === 'string') {
            getFriendShip = JSON.parse(getFriendShip);
          }
          //!-------------auth--message-----------
          if (
            getFriendShip &&
            getFriendShip.receiver.userId !== user.userId &&
            getFriendShip.sender.userId !== user.userId
          ) {
            const errorMessage = {
              success: false,
              statusCode: httpStatus.FORBIDDEN,
              message: 'Forbidden',
            };
            return socketErrorHandler({ socket, callback, errorMessage });
          } else if (getFriendShip?.requestAccept == false) {
            const errorMessage = {
              success: false,
              statusCode: httpStatus.FORBIDDEN,
              message: 'You are not allowed to send message',
            };
            return socketErrorHandler({ socket, callback, errorMessage });
          } else if (getFriendShip?.block?.isBlock == true) {
            const errorMessage = {
              success: false,
              statusCode: httpStatus.FORBIDDEN,
              message: 'Block. you are not allowed to send message',
            };
            return socketErrorHandler({ socket, callback, errorMessage });
          } else if (getFriendShip) {
            messageData.sender =
              getFriendShip?.sender?.userId.toString() == user.userId
                ? getFriendShip?.sender
                : getFriendShip?.receiver;
            messageData.receiver =
              getFriendShip?.sender?.userId.toString() !== user.userId
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
                createdAt: new Date(),
                updateAt: new Date(),
                createTime: new Date(),
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
                  createTime: new Date(),
                  ...messageData,
                  createdAt: new Date(),
                  updateAt: new Date(),
                },
              },
            );
          }
          // your single friend is running multiple devices in run same id. then all device in send message .
          const findSocketIds = await findAllSocketsIdsFromUserId(
            messageData.receiver.userId.toString(),
          );

          if (findSocketIds?.length) {
            socket
              .to(findSocketIds) //[]
              .emit(
                ENUM_SOCKET_EMIT_ON_TYPE.SERVER_TO_CLIENT_PERSONAL_MESSAGE,
                {
                  success: true,
                  // message: 'Message delivered successfully',
                  data: {
                    createTime: new Date(),
                    ...messageData,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                },
              );
          }

          // await pubRedis.publish(
          //   ENUM_REDIS_SUBSCRIBE.socket_message,
          //   JSON.stringify(messageData),
          // );

          await produceMessageByKafka(JSON.stringify(messageData));
        } else {
          const errorMessage = {
            success: false,
            statusCode: 404,
            message: 'friendShipId id not found',
          };
          return socketErrorHandler({ socket, callback, errorMessage });
        }
      } catch (error: any) {
        const errorMessage = {
          success: false,
          statusCode: error?.statusCode || 400,
          message: error?.message || 'Server error',
          error,
        };
        return socketErrorHandler({ socket, callback, errorMessage });
      }
    },
  );
};
