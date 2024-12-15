import { Server, Socket } from 'socket.io';
import { ENUM_SOCKET_STATUS } from '../../global/enum_constant_type';
import { IUserRef } from '../modules/allUser/typesAndConst';
import { User } from '../modules/allUser/user/user.model';
import { errorLogger } from '../share/logger';
import { ENUM_SOCKET_EMIT_ON_TYPE } from './socketTypes';

let socketServer: Server | null = null;

export const socketIo = () => {
  if (!socketServer) {
    // Initialize socketServer if it's not already set
    //@ts-ignore
    socketServer = global.socketIo as Server;
  }
  return socketServer;
};

type ISocketOnlineRes = {
  success?: boolean;
  message: string;
  data: {
    isOnline: boolean;
    socketStatus: string;
    user: IUserRef;
  };
};

export const yourAreOnlineOffline = async (
  userId: string,
  data: ISocketOnlineRes,
) => {
  try {
    const socket = socketIo();
    socket.emit(
      ENUM_SOCKET_EMIT_ON_TYPE.ONLINE_OFFLINE_USER + userId.toString(),
      data,
    );
    let setData = {};
    if (data.data.isOnline) {
      setData = {
        socketStatus: ENUM_SOCKET_STATUS.ONLINE,
      };
    } else {
      setData = {
        'lastActive.createdAt': new Date(),
        socketStatus: ENUM_SOCKET_STATUS.OFFLINE,
      };
      // when user offline then update status
    }
    await User.findByIdAndUpdate(userId, setData, {
      runValidators: true,
      //  new: true //not need because this is not send api
    });
  } catch (error) {
    errorLogger.error(error);
  }
};

export const socketErrorHandler = ({
  socket,
  callback,
  errorMessage,
}: {
  socket: Socket;
  callback?: any;
  errorMessage: any;
}) => {
  if (callback && typeof callback === 'function') {
    return callback(errorMessage);
  } else {
    return socket.emit('error', errorMessage);
  }
};
