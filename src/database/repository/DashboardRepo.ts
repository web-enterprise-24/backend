import prisma from "../prismaClient";

// // Average number of messages from all tutors in the last 7 days
// async function getAverageMessagesPerTutor() {
//   const sevenDaysAgo = new Date();
//   sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//   // Get list of tutors
//   const tutors = await prisma.user.findMany({
//     where: {
//       roles: {
//         some: {
//           code: 'TUTOR',
//         },
//       },
//     },
//     select: {
//       id: true,
//     },
//   });

//   // Count the number of messages from each tutor in the last 7 days
//   const messageCounts = await Promise.all(
//     tutors.map(async (tutor) => {
//       const count = await prisma.message.count({
//         where: {
//           OR: [
//             { senderId: tutor.id },
//             { receiverId: tutor.id },
//           ],
//           createdAt: {
//             gte: sevenDaysAgo,
//           },
//         },
//       });
//       return count;
//     })
//   );

//   // Calculate the average number of messages
//   const totalMessages = messageCounts.reduce((sum, count) => sum + count, 0);
//   const average = tutors.length > 0 ? totalMessages / tutors.length : 0;
//   return average;
// }

// // Average number of messages per tutor per day over the past 7 days
// async function getAverageMessagesForPersonalTutor(tutorId: string) {
//   const sevenDaysAgo = new Date();
//   sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//   // Count total tutor messages in last 7 days
//   const messageCount = await prisma.message.count({
//     where: {
//       OR: [
//         { senderId: tutorId },
//         { receiverId: tutorId },
//       ],
//       createdAt: {
//         gte: sevenDaysAgo,
//       },
//     },
//   });

//   // Average per day
//   const averagePerDay = messageCount / 7;
//   return averagePerDay;
// }

// // List of students without tutors
// async function getStudentsWithoutTutor() {
//   const studentsWithoutTutor = await prisma.user.findMany({
//     where: {
//       roles: {
//         some: {
//           code: 'STUDENT',
//         },
//       },
//       studentAllocations: {
//         none: {},
//       },
//     },
//     select: {
//       id: true,
//       name: true,
//       email: true,
//     },
//   });
//   return studentsWithoutTutor;
// }

// // List of students who have not interacted for 7 or 28 days
// async function getInactiveStudents(days: number) {
//   const dateThreshold = new Date();
//   dateThreshold.setDate(dateThreshold.getDate() - days);

//   const inactiveStudents = await prisma.user.findMany({
//     where: {
//       roles: {
//         some: {
//           code: 'STUDENT',
//         },
//       },
//       AND: [
//         {
//           messages: {
//             none: {
//               createdAt: {
//                 gte: dateThreshold,
//               },
//             },
//           },
//         },
//         {
//           receivedMessages: {
//             none: {
//               createdAt: {
//                 gte: dateThreshold,
//               },
//             },
//           },
//         },
//         {
//           documents: {
//             none: {
//               createdAt: {
//                 gte: dateThreshold,
//               },
//             },
//           },
//         },
//       ],
//     },
//     select: {
//       id: true,
//       name: true,
//       email: true,
//     },
//   });
//   return inactiveStudents;
// }

// // Tutor interaction overview
// async function getTutorInteractions(tutorId: string) {
//   const tutees = await prisma.allocation.findMany({
//     where: {
//       tutorId: tutorId,
//     },
//     select: {
//       student: {
//         select: {
//           id: true,
//           name: true,
//         },
//       },
//     },
//   });

//   const interactions = await Promise.all(
//     tutees.map(async (tutee) => {
//       const messageCount = await prisma.message.count({
//         where: {
//           OR: [
//             { senderId: tutorId, receiverId: tutee.student.id },
//             { senderId: tutee.student.id, receiverId: tutorId },
//           ],
//         },
//       });
//       const documentCount = await prisma.document.count({
//         where: {
//           studentId: tutee.student.id,
//         },
//       });
//       return {
//         student: tutee.student,
//         messageCount,
//         documentCount,
//       };
//     })
//   );

//   return interactions;
// }

// // Student interaction details
// async function getStudentInteractions(studentId: string) {
//   const messages = await prisma.message.findMany({
//     where: {
//       OR: [
//         { senderId: studentId },
//         { receiverId: studentId },
//       ],
//     },
//     orderBy: {
//       createdAt: 'desc',
//     },
//     select: {
//       id: true,
//       content: true,
//       createdAt: true,
//       sender: { select: { name: true } },
//       receiver: { select: { name: true } },
//     },
//   });

//   const documents = await prisma.document.findMany({
//     where: {
//       studentId: studentId,
//     },
//     orderBy: {
//       createdAt: 'desc',
//     },
//     select: {
//       id: true,
//       fileName: true,
//       fileUrl: true,
//       createdAt: true,
//     },
//   });

//   return { messages, documents };
// }

// export default {
//   getAverageMessagesPerTutor,
//   getAverageMessagesForPersonalTutor,
//   getStudentsWithoutTutor,
//   getInactiveStudents,
//   getTutorInteractions,
//   getStudentInteractions,
// };



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

  // // Count total meetings (allocations)
  // const meetingCount = await prisma.allocation.count({
  //   where: {
  //     status: true, // Chỉ tính các allocation đang hoạt động
  //   },
  // });

  // Count total messages
  const messageCount = await prisma.message.count();

  return {
    tutors: tutorCount,
    students: studentCount,
    // meetings: meetingCount,
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
    })
  );

  return activity;
}

// Get tutor performance (name, number of students, number of meetings)
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
      firstName: true,
      lastName: true,
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
      const meetingCount = await prisma.allocation.count({
        where: {
          tutorId: tutor.id,
          status: true,
        },
      });

      return {
        name: `${tutor.name || ''} ${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || 'Unknown',
        students: studentCount,
        meetings: meetingCount,
      };
    })
  );

  return performance;
}

/*----Student----*/

// Get student profile information including tutor name
async function getStudentProfile(studentId: string) {
  const student = await prisma.user.findUnique({
    where: {
      id: studentId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicUrl: true,
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

  if (!student) {
    throw new Error('Student not found');
  }

  const tutorName = student.studentAllocations[0]?.tutor
    ? `${student.studentAllocations[0].tutor.name || ''}`.trim() || 'No Tutor Assigned' : 'No Tutor Assigned';

  return {
    name: `${student.name || ''}`.trim() || 'Unknown',
    email: student.email,
    profilePicUrl: student.profilePicUrl,
    tutorName,
  };
}

// Get overview metrics for a student
async function getStudentOverviewMetrics(studentId: string) {
  // Count total messages sent/received by the student
  const messageCount = await prisma.message.count({
    where: {
      OR: [
        { senderId: studentId },
        { receiverId: studentId },
      ],
    },
  });

  // // Count completed meetings (allocations) for the student
  // const meetingCount = await prisma.allocation.count({
  //   where: {
  //     studentId: studentId,
  //     status: true, // Chỉ tính các allocation đang hoạt động
  //   },
  // });

  // Count total documents uploaded by the student
  const documentCount = await prisma.document.count({
    where: {
      studentId: studentId,
    },
  });

  return {
    messages: messageCount,
    // meetings: meetingCount,
    documents: documentCount,
  };
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
async function getStudentActivity(studentId: string, timeRange: 'lastWeek' | 'lastMonth') {
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
      OR: [
        { senderId: studentId },
        { receiverId: studentId },
      ],
      createdAt: {
        gte: startDate,
      },
    },
  });

  // // Count meetings in the time range
  // const meetingCount = await prisma.allocation.count({
  //   where: {
  //     studentId: studentId,
  //     startAt: {
  //       gte: startDate,
  //     },
  //     status: true,
  //   },
  // });

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
  // const total = messageCount + meetingCount + documentCount;
  const total = messageCount + documentCount;

  return {
    messages: total > 0 ? (messageCount / total) * 100 : 0, // Percentage
    // meetings: total > 0 ? (meetingCount / total) * 100 : 0, // Percentage
    documents: total > 0 ? (documentCount / total) * 100 : 0, // Percentage
    rawCounts: {
      messages: messageCount,
      // meetings: meetingCount,
      documents: documentCount,
    },
  };
}
/*----Tutor----*/

export default {
  getOverviewMetrics,
  getTutorActivity,
  getTutorPerformance,
  getStudentProfile,
  getStudentOverviewMetrics,
  getRecentDocuments,
  getStudentActivity,
}