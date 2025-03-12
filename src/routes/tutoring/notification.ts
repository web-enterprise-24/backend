import express from 'express';
import authentication from '../../auth/authentication';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { deleteNotification, getNotificationsByUserId } from '../../database/repository/NotificationRepo';
import { SuccessResponse } from '../../core/ApiResponse';
import validator from '../../helpers/validator';
import schema from './schema';
import prisma from '../../database/prismaClient';
import { BadRequestError } from '../../core/ApiError';

const router = express.Router();

router.use(authentication);

// Get all notifications of current user
router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortOrder = (req.query.sort as 'asc' | 'desc') || 'desc';

    const baseUrl = `https://${req.get("host")}${req.baseUrl}${req.path}`;

    const notifications = await getNotificationsByUserId(req.user.id, page, limit, sortOrder, baseUrl);

    return new SuccessResponse('Notifications fetched successfully', notifications).send(res);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    // Check if notification exists
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new BadRequestError("Notification not found");
    }

    await deleteNotification(id);

    return new SuccessResponse('Notification deleted successfully', null).send(res);
  }),
);

export default router;