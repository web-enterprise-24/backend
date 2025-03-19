// Define type for each role
export type NotificationTutor = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string | null;
  createdAt: Date;
  updatedAt: Date;
  document: {
    student: {
      id: string;
      name: string | null;
      email: string;
      profilePicUrl: string | null;
    } | null;
  } | null;
};

export type NotificationStudent = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string | null;
  createdAt: Date;
  updatedAt: Date;
  document: {
    student: {
      studentAllocations: {
        tutor: {
          id: string;
          name: string | null;
          email: string;
          profilePicUrl: string | null;
        } | null;
      }[];
    } | null;
  } | null;
};

export type NotificationStaff = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string | null;
  createdAt: Date;
  updatedAt: Date;
  blog: {
    author: {
      id: string;
      name: string | null;
      email: string;
      profilePicUrl: string | null;
    } | null;
  } | null;
};

// Define type for userInfo
export type UserInfo = {
  userId: string;
  userName: string | null;
  userEmail: string;
};

// Defines the response type of the getNotificationsByUserId function
export type NotificationResponse = {
  notifications: {
    id: string;
    title: string;
    message: string;
    status: 'read' | 'unread';
    timestamp: string;
    type: string;
    userInfo: UserInfo | null;
  }[];
  totalPages: number;
  totalNotifications: number;
  result: number;
  nextPage?: string;
  previousPage?: string;
};