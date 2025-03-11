import express from 'express';
import authentication from '../../auth/authentication';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { getNotificationsByUserId } from '../../database/repository/NotificationRepo';
import { SuccessResponse } from '../../core/ApiResponse';
import validator from '../../helpers/validator';
import schema from './schema';

const router = express.Router();

router.use(authentication);

// Get all notifications of current user
router.get(
  '/',
  validator(schema.notification),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const notifications = await getNotificationsByUserId(req.user.id);
    return new SuccessResponse('Notifications fetched successfully', notifications).send(res);
  }),
);

export default router;