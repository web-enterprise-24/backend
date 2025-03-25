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
    // title:
    //   `Meeting with tutor ${meeting.tutor.name || ''}`.trim() ||
    //   'Tutor Meeting',
    title : meeting.title,
    startAt: meeting.start,
    endAt: meeting.end,
    // location: meeting.fileUrl ? 'Virtual' : 'In-Person', // Assuming fileUrl indicates a virtual meeting link
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
  // const now = new Date();

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
  // page: number,
  // limit: number,
  // baseUrl: string,
) {
  // const skip = (page - 1) * limit;

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
    // skip: skip,
    // take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      profilePicUrl: true,
    },
  });

  // Count total tutees for pagination
  // const totalTutees = await prisma.user.count({
  //   where: {
  //     studentAllocations: {
  //       some: {
  //         tutorId: tutorId,
  //         status: true,
  //       },
  //     },
  //   },
  // });

  // Calculate total pages
  // const totalPages = Math.ceil(totalTutees / limit);

  // Create pagination links
  // const pagination: { [key: string]: string | null } = {
  //   nextPage:
  //     page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
  //   previousPage:
  //     page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
  // };

  // Return formatted response
  return {
    // totalPages,
    // currentPage: page,
    // totalTutees,
    // pagination,
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
    // title:
    //   `Meeting with ${meeting.student.name || ''}`.trim() || 'Student Meeting',
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
      createdAt: 'desc', // Sắp xếp theo ngày tải lên mới nhất
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
          // status: true, // Only count active meetings
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

  // efine start date based on timeRange
  if (timeRange === 'thisWeek') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 ngày trước
  } else {
    startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000); // 28 ngày trước (4 tuần)
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
    // Chia theo ngày trong tuần (7 ngày)
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
