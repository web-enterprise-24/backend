import { Notification } from "@prisma/client";
import prisma from "../prismaClient";
import { BadRequestError } from "../../core/ApiError";


export const createNotification = async (data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  documentId?: string;
}): Promise<Notification> => {
  try {
    const notification = await prisma.notification.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new BadRequestError('Failed to create notification');
  }
};

export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        document: true
      }
    });
    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new BadRequestError('Failed to fetch notifications');
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};
