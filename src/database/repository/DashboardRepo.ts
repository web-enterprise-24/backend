import { format, toZonedTime } from 'date-fns-tz';
import prisma from '../prismaClient';

/*----Staff----*/

// Get overview metrics for tutors, students, meetings, and messages
async function getOverviewMetrics() {
  // Count total tutors
  const tutorCount = await prisma.user.count({
    where: {
      roles: {
        some: {
          code: 'TUTOR',
        },
      },
    },
  });

  // Count total students
  const studentCount = await prisma.user.count({
    where: {
      roles: {
        some: {
          code: 'STUDENT',
        },
      },
    },
  });

  // Count total meetings
  const meetingCount = await prisma.meeting.count({
    where: {
      status: true,
    },
  });

  // Count total messages
  const messageCount = await prisma.message.count();

  return {
    tutors: tutorCount,
    students: studentCount,
    meetings: meetingCount,
    messages: messageCount,
  };
}

// Get tutor activity (meetings and messages) over the last 4 weeks
async function getTutorActivity() {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  // Get tutors
  const tutors = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          code: 'TUTOR',
        },
      },
    },
    select: {
      id: true,
    },
  });

  // Define weekly ranges
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const start = new Date();
    start.setDate(start.getDate() - (28 - i * 7));
    const end = new Date();
    end.setDate(end.getDate() - (21 - i * 7));
    weeks.push({ start, end });
  }

  // Calculate meetings and messages for each week
  const activity = await Promise.all(
    weeks.map(async (week, index) => {
      // Count meetings for all tutors in this week
      const meetingCount = await prisma.allocation.count({
        where: {
          tutorId: {
            in: tutors.map((tutor) => tutor.id),
          },
          startAt: {
            gte: week.start,
            lt: week.end,
          },
        },
      });

      // Count messages for all tutors in this week
      const messageCount = await prisma.message.count({
        where: {
          OR: [
            { senderId: { in: tutors.map((tutor) => tutor.id) } },
            { receiverId: { in: tutors.map((tutor) => tutor.id) } },
          ],
          createdAt: {
            gte: week.start,
            lt: week.end,
          },
        },
      });

      return {
        week: `W${index + 1}`,
        meetings: meetingCount,
        messages: messageCount,
      };
    }),
  );

  return activity;
}

// Get tutor performance
async function getTutorPerformance() {
  const tutors = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          code: 'TUTOR',
        },
      },
    },
    select: {
      id: true,
      name: true,
      tutorAllocations: {
        where: {
          status: true,
        },
      },
    },
  });

  const performance = await Promise.all(
    tutors.map(async (tutor) => {
      // Count students assigned to this tutor
      const studentCount = tutor.tutorAllocations.length;

      // Count meetings for this tutor
      const meetingCount = await prisma.meeting.count({
        where: {
          tutorId: tutor.id,
          status: true,
        },
      });

      return {
        name: tutor.name || 'Unknown',
        students: studentCount,
        meetings: meetingCount,
      };
    }),
  );

  return performance;
}

async function getMostActiveUsersByRole() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const roles = ['STAFF', 'TUTOR', 'STUDENT'];
  const result = await Promise.all(roles.map(async (role) => {
    const users = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            code: role,
          },
        },
      },
      include: {
        activityLogs: {
          where: {
            activityType: 'LOGIN',
            timestamp: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });

    const topUser = users.sort((a, b) => b.activityLogs.length - a.activityLogs.length)[0];
    return {
      role,
      user: topUser ? { id: topUser.id, name: topUser.name || 'Unknown', loginCount: topUser.activityLogs.length } : null,
    };
  }));
  return result;
}

const apiToPageMapping: { [key: string]: string } ={
  '/profile/my': 'Profile Page',
  '/profile': 'Profile Page',
  '/profile/create': 'Management Page',
  '/allocate': 'Management Page',
  '/account': 'Management Page',
  '/upload': 'Document Page',
  '/upload/myDocuments': 'Document Page',
  '/upload/myStudentsDocuments': 'Document Page',
  '/feedback': 'Document Page',
  '/chat': 'Chat Page',
  '/chat/userChat': 'Chat Page',
  '/chat/findUserChat': 'Chat Page',
  '/chat/unreadMessages': 'Chat Page',
  '/blogs/latest': 'Blog Page',
  '/blog/writer': 'Blog Page',
  '/blog/editor/submitted/all': 'Blog Page',
  '/blog/editor/publish': 'Blog Page',
  '/blog/editor/unpublish': 'Blog Page',
  '/comment': 'Blog Page',
  '/notification': 'Notification Page',
  '/notification/read': 'Notification Page',
  '/admin/overviewMetrics': 'Staff Dashboard Page',
  '/admin/tutorActivity': 'Staff Dashboard Page',
  '/admin/tutorPerformance': 'Staff Dashboard Page',
  '/admin/viewTutorDashboard': 'Staff Dashboard Page',
  '/admin/viewStudentDashboard': 'Staff Dashboard Page',
  '/admin/userActivityStats': 'Staff Dashboard Page',
  '/admin/getActiveUsers': 'Staff Dashboard Page',
  '/admin/getAccessedPages': 'Staff Dashboard Page',
  '/admin/getUsedBrowsers': 'Staff Dashboard Page',
  '/admin/userLoginStats': 'Staff Dashboard Page',
  '/student/tutorProfile': 'Student Dashboard Page',
  '/student/studentOverviewMetrics': 'Student Dashboard Page',
  '/student/upcomingMeetings': 'Student Dashboard Page',
  '/student/recentDocuments': 'Student Dashboard Page',
  '/student/studentActivity': 'Student Dashboard Page',
  '/tutor/tutorOverviewMetrics': 'Tutor Dashboard Page',
  '/tutor/tuteesInformation': 'Tutor Dashboard Page',
  '/tutor/upcomingMeetings': 'Tutor Dashboard Page',
  '/tutor/recentlyUploadedDocuments': 'Tutor Dashboard Page',
  '/tutor/tuteesActivity': 'Tutor Dashboard Page',
  '/tutor/documentFeedbackAnalytics': 'Tutor Dashboard Page',
  '/meeting': 'Meeting Page',
  '/meeting/tutor': 'Meeting Page',
  '/meeting/accept': 'Meeting Page',
  '/meeting/cancel': 'Meeting Page',
  '/meeting/history': 'Meeting Page',
  '/meeting/record': 'Meeting Page',
};

function mapApiToPage(apiUrl: string): string {
  // Bỏ query parameters, chỉ lấy base path
  const baseUrl = apiUrl.split('?')[0].replace(/\/$/, ''); // Bỏ / ở cuối
  const matchedKey = Object.keys(apiToPageMapping).find((key) =>
    baseUrl.startsWith(key)
  );
  return matchedKey ? apiToPageMapping[matchedKey] : apiUrl;
}

async function getMostAccessedPages(limit = 5) {
  // Get all UserActivity records with activityType as PAGE_VISIT
  const activities = await prisma.userActivity.findMany({
    where: {
      activityType: 'PAGE_VISIT',
    },
    select: {
      pageUrl: true,
    },
  });

  // Group pageUrls into "pages" based on mapping
  const pageCounts = activities.reduce((acc, activity) => {
    const pageUrl = activity.pageUrl ?? 'Unknown';
    const pageName = mapApiToPage(pageUrl);
    acc[pageName] = (acc[pageName] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Convert object to array and sort by number of visits
  const sortedPages = Object.entries(pageCounts)
    .map(([pageName, visitCount]) => ({
      pageName,
      visitCount,
    }))
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, limit);

  return sortedPages;
}

async function getMostUsedBrowsers(limit = 5) {
  const browsers = await prisma.userActivity.groupBy({
    by: ['browser'],
    where: {
      activityType: 'LOGIN',
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limit,
  });
  return browsers.map(b => ({ browser: b.browser || 'Unknown', usageCount: b._count.id }));
}

async function getUserLoginStats() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      activityLogs: {
        where: {
          activityType: 'LOGIN',
        },
        select: {
          timestamp: true,
        },
        orderBy: {
          timestamp: 'desc', // Sort by time descending to get the most recent login
        },
      },
    },
  });

  const userStats = users.map((user) => {
    const lastLogin = user.activityLogs.length > 0 ? user.activityLogs[0].timestamp : null;
    let lastLoginTime = null;

    if (lastLogin) {
      const zoneTime = toZonedTime(lastLogin, 'Asia/Ho_Chi_Minh');
      lastLoginTime = format(zoneTime, "yyyy-MM-dd 'at' HH:mm:ss", {
        timeZone: 'Asia/Ho_Chi_Minh',
      });
    }

    return {
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      lastLogin: lastLoginTime,
    };
  });

  return userStats;
}

async function getStaffDashboard(staffId: string) {
  const staff = await prisma.user.findUnique({
    where: {
      id: staffId,
      roles: {
        some: {
          code: 'STAFF',
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicUrl: true,
    },
  });

  if (!staff) {
    throw new Error('Staff not found');
  }

  const overviewMetrics = await getOverviewMetrics();
  const tutorActivity = await getTutorActivity();
  const tutorPerformance = await getTutorPerformance();
  const userLoginStats = await getUserLoginStats();
  const activeUsers = await getMostActiveUsersByRole();
  const accessedPages = await getMostAccessedPages();
  const usedBrowsers = await getMostUsedBrowsers();
  const allocationCreators = await getAllocationCreators();
  const allocationCancelers = await getAllocationCancelers();

  return {
    staffInfo: {
      id: staff.id,
      name: staff.name || 'Unknown',
      email: staff.email,
      avatar: staff.profilePicUrl,
    },
    overviewMetrics,
    tutorActivity,
    tutorPerformance,
    userLoginStats,
    activeUsers,
    accessedPages,
    usedBrowsers,
    allocationCreators,
    allocationCancelers
  };
}

async function getAllocationCreators() {
  const allocations = await prisma.allocation.findMany({
    where: {
      status: true,
    },
    select: {
      id: true,
      startAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicUrl: true,
        },
      },
      tutor: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicUrl: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicUrl: true,
        },
      },
    },
    orderBy: {
      startAt: 'desc',
    },
  });

  return allocations.map((allocation) => ({
    id: allocation.id,
    student: {
      id: allocation.student.id,
      name: allocation.student.name || 'Unknown',
      email: allocation.student.email,
      avatar: allocation.student.profilePicUrl,
    },
    tutor: allocation.tutor
      ? {
          id: allocation.tutor.id,
          name: allocation.tutor.name || 'Unknown',
          email: allocation.tutor.email,
          avatar: allocation.tutor.profilePicUrl,
        }
      : null,
    creator: allocation.creator
      ? {
          id: allocation.creator.id,
          name: allocation.creator.name || 'Unknown',
          email: allocation.creator.email,
          avatar: allocation.creator.profilePicUrl,
        }
      : { id: null, name: 'Unknown', email: null, avatar: null },
    startAt: allocation.startAt,
  }));
}

async function getAllocationCancelers() {
  const histories = await prisma.allocationHistory.findMany({
    select: {
      id: true,
      studentId: true,
      tutorId: true,
      startAt: true,
      endAt: true,
      canceledBy: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicUrl: true,
        },
      },
      tutor: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicUrl: true,
        },
      },
      canceler: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicUrl: true,
        },
      },
    },
    orderBy: {
      startAt: 'desc',
    },
  });

  const canceledAllocations = histories.map((history) => ({
    id: history.id,
    student: {
      id: history.student.id,
      name: history.student.name || 'Unknown',
      email: history.student.email,
      avatar: history.student.profilePicUrl,
    },
    tutor: history.tutor
      ? {
          id: history.tutor.id,
          name: history.tutor.name || 'Unknown',
          email: history.tutor.email,
          avatar: history.tutor.profilePicUrl,
        }
      : null,
    canceler: history.canceler
      ? {
          id: history.canceler.id,
          name: history.canceler.name || 'Unknown',
          email: history.canceler.email,
          avatar: history.canceler.profilePicUrl,
        }
      : { id: null, name: 'Unknown', email: null, avatar: null },
    startAt: history.startAt,
    canceledAt: history.endAt,
  }));

  return canceledAllocations;
}

/*----Student----*/

// Get tutor profile information for a student
async function getTutorProfile(studentId: string) {
  // Find the student and their allocated tutor
  const student = await prisma.user.findUnique({
    where: {
      id: studentId,
    },
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
  });

  // Throw error if student is not found
  if (!student) {
    throw new Error('Student not found');
  }

  // Check if a tutor is assigned
  const tutor = student.studentAllocations[0]?.tutor;
  if (!tutor) {
    throw new Error('No tutor assigned to this student');
  }

  // Return tutor information
  return {
    name: tutor.name || 'Unknown',
    email: tutor.email,
    avatar: tutor.profilePicUrl || 'default-avatar-url',
  };
}

// Get overview metrics for a student
async function getStudentOverviewMetrics(studentId: string) {
  // Count total messages sent/received by the student
  const messageCount = await prisma.message.count({
    where: {
      OR: [{ senderId: studentId }, { receiverId: studentId }],
    },
  });

  // Count meetings for the student
  const meetingCount = await prisma.meeting.count({
    where: {
      studentId: studentId,
      status: true,
    },
  });

  // Count total documents uploaded by the student
  const documentCount = await prisma.document.count({
    where: {
      studentId: studentId,
    },
  });

  return {
    messages: messageCount,
    meetings: meetingCount,
    documents: documentCount,
  };
}

// Get upcoming meetings for a student
async function getUpcomingMeetingsForStudent(
  studentId: string,
  limit: number = 3,
) {
  const now = new Date();

  const meetings = await prisma.meeting.findMany({
    where: {
      studentId: studentId,
      start: {
        gt: now, // Only fetch meetings in the future
      },
      status: true, // Only active meetings
    },
    orderBy: {
      start: 'asc', // Sort by start time, nearest first
    },
    take: limit,
    select: {
      id: true,
      title: true,
      start: true,
      end: true,
      tutor: {
        select: {
          name: true,
        },
      },
    },
  });

  return meetings.map((meeting) => ({
    id: meeting.id,
    title : meeting.title,
    startAt: meeting.start,
    endAt: meeting.end,
  }));
}

// Get recent documents for a student
async function getRecentDocuments(studentId: string, limit: number = 5) {
  const documents = await prisma.document.findMany({
    where: {
      studentId: studentId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    select: {
      id: true,
      fileName: true,
      createdAt: true,
    },
  });

  return documents.map((doc) => ({
    id: doc.id,
    fileName: doc.fileName,
    uploadedAt: doc.createdAt,
  }));
}

// Get activity distribution for a student
async function getStudentActivity(
  studentId: string,
  timeRange: 'lastWeek' | 'lastMonth',
) {
  const now = new Date();
  let startDate: Date;

  if (timeRange === 'lastWeek') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  }

  // Count messages in the time range
  const messageCount = await prisma.message.count({
    where: {
      OR: [{ senderId: studentId }, { receiverId: studentId }],
      createdAt: {
        gte: startDate,
      },
    },
  });

  // // Count meetings in the time range
  const meetingCount = await prisma.meeting.count({
    where: {
      studentId: studentId,
      status: true,
    },
  });

  // Count documents in the time range
  const documentCount = await prisma.document.count({
    where: {
      studentId: studentId,
      createdAt: {
        gte: startDate,
      },
    },
  });

  // Calculate total for percentage distribution
  const total = messageCount + meetingCount + documentCount;

  return {
    messages: total > 0 ? (messageCount / total) * 100 : 0, // Percentage
    meetings: total > 0 ? (meetingCount / total) * 100 : 0, // Percentage
    documents: total > 0 ? (documentCount / total) * 100 : 0, // Percentage
    rawCounts: {
      messages: messageCount,
      meetings: meetingCount,
      documents: documentCount,
    },
  };
}

/*----Tutor----*/

// Get overview metrics for a tutor
async function getTutorOverviewMetrics(tutorId: string) {
  // Count total tutees assigned to the tutor
  const tuteeCount = await prisma.allocation.count({
    where: {
      tutorId: tutorId,
      status: true,
    },
  });

  // Count total messages sent/received by the tutor
  const messageCount = await prisma.message.count({
    where: {
      OR: [{ senderId: tutorId }, { receiverId: tutorId }],
    },
  });

  // Count meetings for the tutor
  const meetingCount = await prisma.meeting.count({
    where: {
      tutorId: tutorId,
      status: true,
    },
  });

  // Count documents needing feedback (documents without comments from the tutor)
  const documentsNeedingFeedback = await prisma.document.count({
    where: {
      student: {
        studentAllocations: {
          some: {
            tutorId: tutorId,
          },
        },
      },
      comments: {
        none: {
          userId: tutorId, // Không có comment nào từ tutor
        },
      },
    },
  });

  return {
    totalTutees: tuteeCount,
    messages: messageCount,
    meetings: meetingCount,
    documentsNeedingFeedback,
  };
}

// Get tutees information for a tutor with pagination
async function getTuteesInformation(
  tutorId: string,
) {

  // Fetch tutees with pagination
  const tutees = await prisma.user.findMany({
    where: {
      studentAllocations: {
        some: {
          tutorId: tutorId,
          status: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicUrl: true,
    },
  });

  return {
    tutees: tutees.map((tutee) => ({
      id: tutee.id,
      name: tutee.name || 'Unknown',
      email: tutee.email,
      avatar: tutee.profilePicUrl || 'default-avatar-url',
    })),
  };
}

// Get upcoming meetings for a tutor
async function getUpcomingMeetingsForTutor(tutorId: string, limit: number = 3) {
  const now = new Date();
  const meetings = await prisma.meeting.findMany({
    where: {
      tutorId: tutorId,
      start: {
        gt: now,
      },
      status: true,
    },
    orderBy: {
      start: 'asc',
    },
    take: limit,
    select: {
      id: true,
      start: true,
      end: true,
      title: true,
      student: {
        select: {
          name: true,
        },
      },
    },
  });

  return meetings.map((meeting) => ({
    id: meeting.id,
    title : meeting.title,
    startAt: meeting.start,
    endAt: meeting.end,
  }));
}

// Get recently uploaded documents by tutees
async function getRecentlyUploadedDocuments(
  tutorId: string,
  limit: number = 3,
) {
  const documents = await prisma.document.findMany({
    where: {
      student: {
        studentAllocations: {
          some: {
            tutorId: tutorId,
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    select: {
      id: true,
      fileName: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicUrl: true,
        },
      },
    },
  });

  return documents.map((doc) => ({
    id: doc.id,
    title: doc.fileName,
    name: doc.student.name || 'Unknown',
    email: doc.student.email,
    avatar: doc.student.profilePicUrl || 'default-avatar-url',
    uploadedAt: doc.createdAt,
  }));
}

// Get tutees activity for a tutor
async function getTuteesActivity(
  tutorId: string,
  timeRange: 'lastWeek' | 'lastMonth',
) {
  const now = new Date();
  let startDate: Date;
  let interval: 'day' | 'week';

  if (timeRange === 'lastWeek') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    interval = 'day';
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    interval = 'week';
  }

  const tutees = await prisma.user.findMany({
    where: {
      studentAllocations: {
        some: {
          tutorId: tutorId,
          status: true,
        },
      },
    },
    select: {
      id: true,
    },
  });

  const tuteeIds = tutees.map((tutee) => tutee.id);

  // Define intervals for the chart
  const intervals = [];
  if (interval === 'day') {
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      intervals.push({
        start: date,
        label: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      });
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const start = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      intervals.push({ start, label: `Week ${i + 1}` });
    }
  }

  const activity = await Promise.all(
    intervals.map(async (intervalObj) => {
      // Renamed to avoid confusion
      const end = new Date(
        intervalObj.start.getTime() +
          (interval === 'day' ? 1 : 7) * 24 * 60 * 60 * 1000,
      );

      const messages = await prisma.message.count({
        where: {
          OR: [
            { senderId: { in: tuteeIds } },
            { receiverId: { in: tuteeIds } },
          ],
          createdAt: {
            gte: intervalObj.start,
            lt: end,
          },
        },
      });

      const meetings = await prisma.meeting.count({
        where: {
          studentId: { in: tuteeIds },
          tutorId: tutorId, // Ensure the meeting involves this tutor
          start: {
            gte: intervalObj.start,
            lt: end,
          },
        },
      });

      const documents = await prisma.document.count({
        where: {
          studentId: { in: tuteeIds },
          createdAt: {
            gte: intervalObj.start,
            lt: end,
          },
        },
      });

      return {
        label: intervalObj.label,
        messages,
        meetings,
        documents,
      };
    }),
  );

  return activity;
}

// Get document feedback analytics for a tutor
async function getDocumentFeedbackAnalytics(
  tutorId: string,
  timeRange: 'thisWeek' | 'thisMonth',
) {
  const now = new Date();
  let startDate: Date;

  // Define start date based on timeRange
  if (timeRange === 'thisWeek') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  }

  // Get the tutor's list of tutees
  const tutees = await prisma.user.findMany({
    where: {
      studentAllocations: {
        some: {
          tutorId: tutorId,
          status: true,
        },
      },
    },
    select: {
      id: true,
    },
  });

  const tuteeIds = tutees.map((tutee) => tutee.id);

  // Define intervals
  const intervals = [];
  if (timeRange === 'thisWeek') {
    // Divide by day of the week (7 days)
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      intervals.push({
        start: day,
        label: day.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      });
    }
  } else {
    // Divide by week in month (4 weeks)
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(
        startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000,
      );
      intervals.push({
        start: weekStart,
        label: `Week ${i + 1}`,
      });
    }
  }

  // Calculate data for each time period
  const analytics = await Promise.all(
    intervals.map(async (interval) => {
      const end = new Date(
        interval.start.getTime() +
          (timeRange === 'thisWeek'
            ? 24 * 60 * 60 * 1000
            : 7 * 24 * 60 * 60 * 1000),
      ); // 1 day for this Week, 7 days for this Month

      // Count the number of documents received during this period
      const documentsReceived = await prisma.document.count({
        where: {
          studentId: { in: tuteeIds },
          createdAt: {
            gte: interval.start,
            lt: end,
          },
        },
      });

      // Count the number of documents that were responded to during this time period
      const feedbackProvided = await prisma.document.count({
        where: {
          studentId: { in: tuteeIds },
          createdAt: {
            gte: interval.start,
            lt: end,
          },
          comments: {
            some: {
              userId: tutorId,
            },
          },
        },
      });

      return {
        label: interval.label,
        documentsReceived,
        feedbackProvided,
      };
    }),
  );

  return analytics;
}

export default {
  getOverviewMetrics,
  getTutorActivity,
  getTutorPerformance,
  getMostActiveUsersByRole,
  getMostAccessedPages,
  getMostUsedBrowsers,
  getUserLoginStats,
  getStaffDashboard,
  getAllocationCreators,
  getAllocationCancelers,
  getTutorProfile,
  getStudentOverviewMetrics,
  getUpcomingMeetingsForStudent,
  getRecentDocuments,
  getStudentActivity,
  getTutorOverviewMetrics,
  getTuteesInformation,
  getUpcomingMeetingsForTutor,
  getRecentlyUploadedDocuments,
  getTuteesActivity,
  getDocumentFeedbackAnalytics,
};
