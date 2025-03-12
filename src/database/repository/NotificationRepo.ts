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

export const getNotificationsByUserId = async (
  userId: string, 
  page: number, 
  limit: number,
  sortOrder: 'asc' | 'desc' = 'desc',
  baseUrl: string
): Promise<{
    notifications: Notification[];
    totalPages: number;
    totalNotifications: number;
    result: number;
    nextPage?: string;
    previousPage?: string;
  }> => {
  try {
    // Get total number of user notifications
    const totalNotifications = await prisma.notification.count({
      where: { userId },
    })

    // Calculate total number of pages
    const totalPages = totalNotifications > 0 ? Math.ceil(totalNotifications / limit) : 0;

    // Get list of notifications
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: {
        createdAt: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        document: {
          include: {
            student: {
              select: {
                name: true,
                email: true,
                profilePicUrl: true,
              }
            }
          }
        }
      }
    });

    // Create next & previous page links
    const nextPage = page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}&sort=${sortOrder}` : undefined;
    const previousPage = page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}&sort=${sortOrder}` : undefined;

    return {
      result: notifications.length,
      totalPages,
      totalNotifications,
      notifications,
      nextPage,
      previousPage,
    };
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
