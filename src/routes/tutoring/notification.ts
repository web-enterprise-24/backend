import express from 'express';
import authentication from '../../auth/authentication';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import {
  deleteNotification,
  getNotificationsByUserId,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../database/repository/NotificationRepo';
import { SuccessResponse } from '../../core/ApiResponse';
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

    const baseUrl = `https://${req.get('host')}${req.baseUrl}${req.path}`;

    const notifications = await getNotificationsByUserId(
      req.user.id,
      page,
      limit,
      sortOrder,
      baseUrl,
    );

    return new SuccessResponse(
      'Notifications fetched successfully',
      notifications,
    ).send(res);
  }),
);

router.patch(
  '/:id/read',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    // Check if notification id exists
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new BadRequestError('Notification not found');
    }

    // Update notification status
    const updatedNotification = await markNotificationAsRead(id);

    return new SuccessResponse(
      'Notification marked as read',
      updatedNotification,
    ).send(res);
  }),
);

router.patch(
  '/read',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const tutorId = req.user.id;

    // Update all unread tutor notifications
    const updatedCount = await markAllNotificationsAsRead(tutorId);

    return new SuccessResponse(
      `${updatedCount} notifications marked as read`,
      null,
    ).send(res);
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
      throw new BadRequestError('Notification not found');
    }

    await deleteNotification(id);

    return new SuccessResponse('Notification deleted successfully', null).send(
      res,
    );
  }),
);

export default router;
