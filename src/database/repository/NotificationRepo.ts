import { Notification } from "@prisma/client";
import prisma from "../prismaClient";
import { BadRequestError } from "../../core/ApiError";
import { NotificationResponse, NotificationStaff, NotificationStudent, NotificationTutor, UserInfo } from "../model/Types";

export const createNotification = async (data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  documentId?: string;
  blogId?: string;
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

// export const getNotificationsByUserId = async (
//   userId: string, 
//   page: number, 
//   limit: number,
//   sortOrder: 'asc' | 'desc' = 'desc',
//   baseUrl: string
// ): Promise<{
//     notifications: Notification[];
//     totalPages: number;
//     totalNotifications: number;
//     result: number;
//     nextPage?: string;
//     previousPage?: string;
//   }> => {
//   try {
//     // Get total number of user notifications
//     const totalNotifications = await prisma.notification.count({
//       where: { userId },
//     })

//     // Calculate total number of pages
//     const totalPages = totalNotifications > 0 ? Math.ceil(totalNotifications / limit) : 0;

//     // Get list of notifications
//     const notifications = await prisma.notification.findMany({
//       where: { userId },
//       orderBy: { createdAt: sortOrder },
//       skip: (page - 1) * limit,
//       take: limit,
//       include: {
//         document: {
//           include: {
//             student: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 profilePicUrl: true,
//                 studentAllocations: {  // Get tutor information
//                   include: {
//                     tutor: {
//                       select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                         profilePicUrl: true,
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//         blog: {
//           select: {
//             id: true,
//             title: true,
//             createdAt: true,
//             author: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 profilePicUrl: true,
//               }
//             }
//           }
//         }
//       },
//     });

//     // Create next & previous page links
//     const nextPage = page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}&sort=${sortOrder}` : undefined;
//     const previousPage = page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}&sort=${sortOrder}` : undefined;

//     return {
//       result: notifications.length,
//       totalPages,
//       totalNotifications,
//       notifications,
//       nextPage,
//       previousPage,
//     };
//   } catch (error) {
//     console.error('Error fetching notifications:', error);
//     throw new BadRequestError('Failed to fetch notifications');
//   }
// };

export const getNotificationsByUserId = async (
  userId: string,
  page: number,
  limit: number,
  sortOrder: 'asc' | 'desc' = 'desc',
  baseUrl: string
): Promise<NotificationResponse> => {
  try {
    const totalNotifications = await prisma.notification.count({
      where: { userId },
    });

    const totalPages = totalNotifications > 0 ? Math.ceil(totalNotifications / limit) : 0;

    const userRole = await prisma.role.findFirst({
      where: { users: { some: { id: userId } } },
      select: { code: true },
    });

    if (!userRole) {
      throw new BadRequestError("User role not found");
    }

    let selectOptions: any;

    switch (userRole.code) {
      case "TUTOR":
        selectOptions = {
          id: true,
          title: true,
          message: true,
          isRead: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          document: {
            select: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profilePicUrl: true,
                },
              },
            },
          },
        };
        break;

      case "STUDENT":
        selectOptions = {
          id: true,
          title: true,
          message: true,
          isRead: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          document: {
            select: {
              student: {
                select: {
                  studentAllocations: {
                    select: {
                      tutor: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          profilePicUrl: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        };
        break;

      case "STAFF":
        selectOptions = {
          id: true,
          title: true,
          message: true,
          isRead: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          blog: {
            select: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profilePicUrl: true,
                },
              },
            },
          },
        };
        break;

      default:
        throw new BadRequestError("Invalid user role");
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: selectOptions,
    }) as unknown as (NotificationTutor | NotificationStudent | NotificationStaff)[];

    // Transform data with status of literal type
    const customizedNotifications = notifications.map(notification => {
      const status: 'read' | 'unread' = notification.isRead ? 'read' : 'unread';

      const baseData = {
        id: notification.id,
        title: notification.title.toUpperCase(),
        message: notification.message,
        status, // Use the casted status variable
        timestamp: notification.createdAt.toISOString(),
        type: notification.type || 'general',
      };

      let userInfo: UserInfo | null = null;

      switch (userRole.code) {
        case "TUTOR": {
          const tutorNotif = notification as NotificationTutor;
          const student = tutorNotif.document?.student;
          if (student) {
            userInfo = {
              userId: student.id,
              userName: student.name,
              userEmail: student.email,
            };
          }
          break;
        }
        case "STUDENT": {
          const studentNotif = notification as NotificationStudent;
          const tutor = studentNotif.document?.student?.studentAllocations?.[0]?.tutor;
          if (tutor) {
            userInfo = {
              userId: tutor.id,
              userName: tutor.name,
              userEmail: tutor.email,
            };
          }
          break;
        }
        case "STAFF": {
          const staffNotif = notification as NotificationStaff;
          const author = staffNotif.blog?.author;
          if (author) {
            userInfo = {
              userId: author.id,
              userName: author.name,
              userEmail: author.email,
            };
          }
          break;
        }
      }

      return {
        ...baseData,
        userInfo,
      };
    });

    const nextPage = page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}&sort=${sortOrder}` : undefined;
    const previousPage = page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}&sort=${sortOrder}` : undefined;

    return {
      result: customizedNotifications.length,
      totalPages,
      totalNotifications,
      notifications: customizedNotifications,
      nextPage,
      previousPage,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new BadRequestError('Failed to fetch notifications');
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  try {
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return updatedNotification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new BadRequestError('Failed to mark notification as read');
  }
};

export const markAllNotificationsAsRead = async (tutorId: string): Promise<number> => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        isRead: false,
        userId: tutorId, // Update notices for this tutor only
      },
      data: { isRead: true },
    });

    console.log("Update result:", result);

    return result.count;
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    throw new BadRequestError('Failed to mark notifications as read');
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
