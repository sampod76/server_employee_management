import express from 'express';

import { AllTextFieldRoute } from '../modules/AllTextField/route.AllTextField';

import { userRoutes } from '../modules/allUser/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.route';
import { AWSRoute } from '../modules/aws/route.AWS';
import { CategoryRoute } from '../modules/category/route.category';
import { UserLoginHistoryRoutes } from '../modules/loginHistory/loginHistory.route';
import { NotificationRoute } from '../modules/notification/notification.route';

import { adminRoutes } from '../modules/allUser/admin/admin.route';

import { AdminSettingRoute } from '../modules/adminSetting/route.adminSetting';

import { EmployeeUserRoutes } from '../modules/allUser/employee/route.employee';
import { HrAdminRoutes } from '../modules/allUser/hrAdmin/route.hrAdmin';
import { CheckInOutRoute } from '../modules/checkInOut/route.checkInOut';

import { LeaveManagementRoute } from '../modules/leaveManagment/route.leaveManagement';
import { ProjectRoute } from '../modules/project/route.project';
import { TaskManagementRoute } from '../modules/taskManagement/route.taskManagement';
import { FriendShipsRoute } from '../modules/messageing/friendship/friendship.route';
import { ChatMessageRoute } from '../modules/messageing/message/messages.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/admins',
    route: adminRoutes,
  },

  {
    path: '/hr-admin',
    route: HrAdminRoutes,
  },
  {
    path: '/employee',
    route: EmployeeUserRoutes,
  },
  {
    path: '/projects',
    route: ProjectRoute,
  },
  {
    path: '/task-management',
    route: TaskManagementRoute,
  },
  {
    path: '/checkin-checkout',
    route: CheckInOutRoute,
  },
  {
    path: '/leaves',
    route: LeaveManagementRoute,
  },

  {
    path: '/login_history',
    route: UserLoginHistoryRoutes,
  },

  {
    path: '/category',
    route: CategoryRoute,
  },

  {
    path: '/friend-ship',
    route: FriendShipsRoute,
  },
  {
    path: '/chat-messages',
    route: ChatMessageRoute,
  },

  {
    path: '/all-text-fields',
    route: AllTextFieldRoute,
  },

  {
    path: '/notification',
    route: NotificationRoute,
  },
  {
    path: '/admin-setting',
    route: AdminSettingRoute,
  },
  {
    path: '/aws',
    route: AWSRoute,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
