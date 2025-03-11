import express from 'express';
import authentication from '../../auth/authentication';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { getNotificationsByUserId } from '../../database/repository/NotificationRepo';
import { SuccessResponse } from '../../core/ApiResponse';

const router = express.Router();

router.use(authentication);

// Lấy tất cả notifications của user hiện tại
router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const notifications = await getNotificationsByUserId(req.user.id);
    return new SuccessResponse('Notifications fetched successfully', notifications).send(res);
  }),
);

export default router;