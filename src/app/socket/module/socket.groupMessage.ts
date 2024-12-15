import httpStatus from 'http-status';
import { Server, Socket } from 'socket.io';
import { produceGroupMessageByKafka } from '../../kafka/producer.kafka';
import { IUserRef } from '../../modules/allUser/typesAndConst';
import { IGroupMessage } from '../../modules/messageing/groupMessage/interface.groupMessage';
import { groupMessageZodData } from '../../modules/messageing/groupMessage/validation.groupMessage';
import { GroupMember } from '../../modules/messageing/groupUserMember/models.groupUserMember';
import { findGroupMemberInRedisOrDb } from '../../modules/messageing/groupUserMember/utils.groupUserMember';
import { ENUM_REDIS_KEY } from '../../redis/consent.redis';
import { redisClient } from '../../redis/redis';
import { socketErrorHandler } from '../socket.service';
import { ENUM_SOCKET_EMIT_ON_TYPE } from '../socketTypes';
export const groupMessageSocket = (
  io: Server,
  socket: Socket,
  user: IUserRef & { token: string },
) => {
  //?------chat message---start ----------------------------
  socket.on(
    ENUM_SOCKET_EMIT_ON_TYPE.CLIENT_TO_SERVER_GROUP_MESSAGE,
    async (messageData: IGroupMessage | string, callback: any) => {
      try {
        if (typeof messageData === 'string') {
          messageData = JSON.parse(messageData);
        }

        if (typeof messageData !== 'object' || Array.isArray(messageData)) {
          const errorMessage = {
            success: false,
            statusCode: httpStatus.NOT_ACCEPTABLE,
            message: 'Invalid message data',
          };
          return socketErrorHandler({ socket, callback, errorMessage });
          // return callback({
          //   success: false,
          //   statusCode: httpStatus.NOT_ACCEPTABLE,
          //   message: 'Invalid message data',
          // });
        }
        messageData.sender = {
          role: user.role,
          userId: user.userId,
          roleBaseUserId: user.roleBaseUserId,
        };

        groupMessageZodData.parse(messageData);

        // console.log('🚀 ~ usp1.on ~ messageData:', messageData);
        let getGroupMember = await findGroupMemberInRedisOrDb(
          messageData.groupMemberId.toString(),
          { validateUserId: user.userId.toString() },
        );

        //
        if (!getGroupMember) {
          // getGroupMember = (await FriendShip.findById(
          //   messageData?.friendShipId,
          // )) as IFriendShip;
          getGroupMember = await GroupMember.isGroupMemberExistMethod(
            messageData?.groupMemberId?.toString(),
            {
              populate: true,
              //@ts-ignore
              project: { name: 1, profileImage: 1, email: 1 },
            },
          );

          if (getGroupMember) {
            await redisClient.set(
              ENUM_REDIS_KEY.REDIS_IN_SAVE_FRIENDSHIP +
                messageData?.groupMemberId,
              JSON.stringify(getGroupMember),
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
        if (typeof getGroupMember === 'string') {
          getGroupMember = JSON.parse(getGroupMember);
        }
        //!-------------auth--message-----------
        if (getGroupMember?.groupId !== messageData.groupId) {
          const errorMessage = {
            success: false,
            statusCode: httpStatus.FORBIDDEN,
            message: 'Forbidden',
          };
          return socketErrorHandler({ socket, callback, errorMessage });
        } else if (
          getGroupMember &&
          getGroupMember.sender.userId !== user.userId
        ) {
          const errorMessage = {
            success: false,
            statusCode: httpStatus.FORBIDDEN,
            message: 'Forbidden',
          };
          return socketErrorHandler({ socket, callback, errorMessage });
        } else if (getGroupMember?.requestAccept == false) {
          const errorMessage = {
            success: false,
            statusCode: httpStatus.FORBIDDEN,
            message: 'You are not allowed to send message',
          };
          return socketErrorHandler({ socket, callback, errorMessage });
        } else if (getGroupMember?.block?.isBlock == true) {
          const errorMessage = {
            success: false,
            statusCode: httpStatus.FORBIDDEN,
            message: 'Block. you are not allowed to send message',
          };
          return socketErrorHandler({ socket, callback, errorMessage });
        } else {
          //set sender details
          messageData.sender = getGroupMember?.receiver;
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
          socket.emit(ENUM_SOCKET_EMIT_ON_TYPE.CLIENT_TO_SERVER_GROUP_MESSAGE, {
            success: true,
            message: 'Message delivered successfully',
            data: {
              createTime: new Date(),
              ...messageData,
              createdAt: new Date(),
              updateAt: new Date(),
            },
          });
        }
        // your single friend is running multiple devices in run same id. then all device in send message .
        //   const findSocketIds = await findAllSocketsIdsFromUserId(
        //     messageData.receiver.userId.toString(),
        //   );

        socket.broadcast //.to(findSocketIds) //[]
          .emit(
            ENUM_SOCKET_EMIT_ON_TYPE.SERVER_TO_CLIENT_GROUP_MESSAGE +
              messageData.groupId,
            {
              success: true,
              message: 'Message delivered successfully',
              data: {
                createTime: new Date(),
                ...messageData,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          );
        //   if (findSocketIds?.length) {

        //   }

        // await pubRedis.publish(
        //   ENUM_REDIS_SUBSCRIBE.socket_message,
        //   JSON.stringify(messageData),
        // );

        await produceGroupMessageByKafka(JSON.stringify(messageData));
      } catch (error: any) {
        const errorMessage = {
          success: false,
          statusCode: error?.statusCode || 400,
          message: error?.message || 'Server error',
          error,
        };
        return socketErrorHandler({ socket, callback, errorMessage });

        // logger.error(JSON.stringify(error));
        // socket.emit('error', {
        //   success: false,
        //   statusCode: error?.statusCode || 400,
        //   message: error?.message || 'Server error',
        //   error,
        // });
      }
    },
  );
};
