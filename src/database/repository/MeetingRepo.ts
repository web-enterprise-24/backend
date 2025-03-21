import { BadRequestError } from '../../core/ApiError';
import prisma from '../prismaClient';
import AllocateRepo from './AllocateRepo';
import { createNotification } from './NotificationRepo';

// async function createMeeting(studentId: string, start: Date, end: Date) {
//   const findTutor = await AllocateRepo.getMyTutor(studentId);
//   if (!findTutor) {
//     throw new BadRequestError('Tutor not found');
//   }

//   const isFuture = new Date(start) > new Date();
//   if (!isFuture) {
//     throw new BadRequestError('Start time must be in the future');
//   }
//   if (start >= end) {
//     throw new BadRequestError('Start date must be lower than end date');
//   }
//   const isAvailable = await prisma.meeting.findFirst({
//     where: {
//       tutorId: findTutor.id,
//       start: { lte: end },
//       end: { gte: start },
//     },
//   });
//   if (isAvailable) {
//     throw new BadRequestError('Time is not available');
//   }
//   const meeting = await prisma.meeting.create({
//     data: {
//       studentId,
//       tutorId: findTutor.id,
//       start,
//       end,
//     },
//   });
//   return meeting;
// }

async function createMeeting(studentId: string, start: Date, end: Date) {
  const findTutor = await AllocateRepo.getMyTutor(studentId);
  if (!findTutor) {
    throw new BadRequestError('Tutor not found');
  }

  const isFuture = new Date(start) > new Date();

  if (!isFuture) {
    throw new BadRequestError('Start time must be in the future');
  }
  if (start >= end) {
    throw new BadRequestError('Start date must be lower than end date');
  }

  const isAvailable = await prisma.meeting.findFirst({
    where: {
      tutorId: findTutor.id,
      start: { lte: end },
      end: { gte: start },
    },
  });

  if (isAvailable) {
    throw new BadRequestError('Time is not available');
  }

  const meeting = await prisma.meeting.create({
    data: {
      studentId,
      tutorId: findTutor.id,
      start,
      end,
    },
  });

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { name: true },
  });

  if (!student) {
    throw new BadRequestError('Student not found');
  }

  // Send notification to tutor
  await createNotification({
    userId: findTutor.id,
    title: 'New Meeting Request',
    message: `${student.name} has requested a meeting`,
    type: 'meeting_request',
    meetingId: meeting.id,
  });

  return meeting;
}

async function getMyTutorSchedule(studentId: string) {
  const myTutor = await AllocateRepo.getMyTutor(studentId);
  if (!myTutor) {
    throw new BadRequestError('Tutor not found');
  }
  const meetings = await prisma.meeting.findMany({
    where: { tutorId: myTutor?.id },
    orderBy: { start: 'desc' },
  });
  return meetings;
}

async function getMySchedule(isTutor: boolean, userId: string) {
  const meetings = await prisma.meeting.findMany({
    where: { ...(isTutor ? { tutorId: userId } : { studentId: userId }) },
    include: {
      tutor: {
        select: {
          id: true,
          name: true,
          profilePicUrl: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          profilePicUrl: true,
        },
      },
    },
    orderBy: { start: 'desc' },
  });
  return meetings;
}

async function getMeetingHistory(isTutor: boolean, userId: string) {
  const meetings = await prisma.meeting.findMany({
    where: {
      ...(isTutor ? { tutorId: userId } : { studentId: userId }),
      end: { lte: new Date() },
    },
    include: {
      tutor: {
        select: {
          id: true,
          name: true,
          profilePicUrl: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          profilePicUrl: true,
        },
      },
    },
  });
  return meetings;
}

// async function cancelMeeting(id: string) {
//   const meeting = await prisma.meeting.delete({
//     where: { id, accepted: false },
//   });
//   return meeting;
// }

// async function acceptMeeting(id: string, tutorId: string) {
//   console.log('🚀 ~ acceptMeeting ~ id:', id);
//   const meeting = await prisma.meeting.update({
//     where: { id, tutorId },
//     data: { accepted: true },
//   });
//   return meeting;
// }

async function cancelMeeting(id: string) {
  const meeting = await prisma.meeting.delete({
    where: { id, accepted: false },
  });

  // Send notification to student
  await createNotification({
    userId: meeting.studentId,
    title: 'Meeting Canceled',
    message: `Your meeting has been canceled by your tutor.`,
    type: 'meeting_canceled',
    meetingId: meeting.id,
  });

  return meeting;
}

async function acceptMeeting(id: string, tutorId: string) {
  const meeting = await prisma.meeting.update({
    where: { id, tutorId },
    data: { accepted: true },
  });

  // Send notification to student
  await createNotification({
    userId: meeting.studentId,
    title: 'Meeting Accepted',
    message: `Your meeting has been accepted by your tutor.`,
    type: 'meeting_accepted',
    meetingId: meeting.id,
  });

  return meeting;
}

async function updateFileUrl(meetingId: string, fileUrl: string) {
  try {
    const updated = await prisma.meeting.update({
      where: { id: meetingId, accepted: true },
      data: { fileUrl },
    });
    return updated;
  } catch (error) {
    console.log('🚀 ~ updateFileUrl ~ error:', error);
    throw new BadRequestError('Meeting not found');
  }
}
export default {
  createMeeting,
  getMyTutorSchedule,
  getMySchedule,
  getMeetingHistory,
  cancelMeeting,
  acceptMeeting,
  updateFileUrl,
};
