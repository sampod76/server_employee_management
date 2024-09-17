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
import { BuyerUserRoutes } from '../modules/allUser/buyer/route.buyer';
import { SellerRoutes } from '../modules/allUser/seller/route.seller';


import { FriendShipsRoute } from '../modules/friendship/friendship.route';
import { GigsRoute } from '../modules/gig/route.gig';
import { ChatMessageRoute } from '../modules/message/messages.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/admins',
    route: adminRoutes,
  },

  {
    path: '/buyer-users',
    route: BuyerUserRoutes,
  },
  {
    path: '/seller-users',
    route: SellerRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
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
    path: '/gig',
    route: GigsRoute,
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
