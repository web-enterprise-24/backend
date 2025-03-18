import prisma from "../prismaClient";

// Average number of messages from all tutors in the last 7 days
async function getAverageMessagesPerTutor() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get list of tutors
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

  // Count the number of messages from each tutor in the last 7 days
  const messageCounts = await Promise.all(
    tutors.map(async (tutor) => {
      const count = await prisma.message.count({
        where: {
          OR: [
            { senderId: tutor.id },
            { receiverId: tutor.id },
          ],
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      });
      return count;
    })
  );

  // Calculate the average number of messages
  const totalMessages = messageCounts.reduce((sum, count) => sum + count, 0);
  const average = tutors.length > 0 ? totalMessages / tutors.length : 0;
  return average;
}

// Average number of messages per tutor per day over the past 7 days
async function getAverageMessagesForPersonalTutor(tutorId: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Count total tutor messages in last 7 days
  const messageCount = await prisma.message.count({
    where: {
      OR: [
        { senderId: tutorId },
        { receiverId: tutorId },
      ],
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  // Average per day
  const averagePerDay = messageCount / 7;
  return averagePerDay;
}

// List of students without tutors
async function getStudentsWithoutTutor() {
  const studentsWithoutTutor = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          code: 'STUDENT',
        },
      },
      studentAllocations: {
        none: {},
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  return studentsWithoutTutor;
}

// List of students who have not interacted for 7 or 28 days
async function getInactiveStudents(days: number) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const inactiveStudents = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          code: 'STUDENT',
        },
      },
      AND: [
        {
          messages: {
            none: {
              createdAt: {
                gte: dateThreshold,
              },
            },
          },
        },
        {
          receivedMessages: {
            none: {
              createdAt: {
                gte: dateThreshold,
              },
            },
          },
        },
        {
          documents: {
            none: {
              createdAt: {
                gte: dateThreshold,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  return inactiveStudents;
}

// Tutor interaction overview
async function getTutorInteractions(tutorId: string) {
  const tutees = await prisma.allocation.findMany({
    where: {
      tutorId: tutorId,
    },
    select: {
      student: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const interactions = await Promise.all(
    tutees.map(async (tutee) => {
      const messageCount = await prisma.message.count({
        where: {
          OR: [
            { senderId: tutorId, receiverId: tutee.student.id },
            { senderId: tutee.student.id, receiverId: tutorId },
          ],
        },
      });
      const documentCount = await prisma.document.count({
        where: {
          studentId: tutee.student.id,
        },
      });
      return {
        student: tutee.student,
        messageCount,
        documentCount,
      };
    })
  );

  return interactions;
}

// Student interaction details
async function getStudentInteractions(studentId: string) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: studentId },
        { receiverId: studentId },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: { select: { name: true } },
      receiver: { select: { name: true } },
    },
  });

  const documents = await prisma.document.findMany({
    where: {
      studentId: studentId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      createdAt: true,
    },
  });

  return { messages, documents };
}

export default {
  getAverageMessagesPerTutor,
  getAverageMessagesForPersonalTutor,
  getStudentsWithoutTutor,
  getInactiveStudents,
  getTutorInteractions,
  getStudentInteractions,
};