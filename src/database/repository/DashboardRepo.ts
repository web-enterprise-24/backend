// import prisma from "../prismaClient";

import { get } from "lodash";
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

export default {
  getOverviewMetrics,
  getTutorActivity,
  getTutorPerformance,
}