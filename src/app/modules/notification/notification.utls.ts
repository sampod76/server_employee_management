import { Server } from 'socket.io';
import { I_USER_ROLE } from '../allUser/user/user.interface';

// Define a type that requires either userId or role
type NotificationBase<T> = {
  message?: string;
  data?: T;
};

type UserNotification<T> = NotificationBase<T> & {
  userId: string;
  role?: never;
};
type RoleNotification<T> = NotificationBase<T> & {
  role: I_USER_ROLE;
  userId?: never;
};

export type IServiceNotification<T> = (
  | UserNotification<T>
  | RoleNotification<T>
)[];

export const sendNotificationFromDB = <T>(
  payload: IServiceNotification<T>,
  data?: T, //when
): void => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const socketIo: Server = global?.socketIo;
  // console.log(payload, 'payload');
  if (socketIo) {
    payload.forEach(data => {
      if ('role' in data && data.role) {
        socketIo.emit(`notification_role_base::${data.role}`, {
          success: true,
          statusCode: 200,
          message: data.message || 'Notification sent successfully',
          data: data,
        });
      } else if ('userId' in data && data.userId) {
        const { userId, ...rest } = data;

        socketIo.emit(`notification::${userId}`, {
          success: true,
          statusCode: 200,
          message: data.message || 'Notification sent successfully',
          //   data: Object.assign({ userId }, rest.data),
          data: {
            userId,
            ...rest.data,
          },
        });
      }
    });
  }
};
