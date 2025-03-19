import { BadRequestError } from '../../core/ApiError';
import prisma from '../prismaClient';
import AllocateRepo from './AllocateRepo';

async function createMeeting(studentId: string, start: Date, end: Date) {
  const findTutor = await AllocateRepo.getMyTutor(studentId);
  if (!findTutor) {
    throw new BadRequestError('Tutor not found');
  }
  // check if the time is available || deny if overlap
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

async function getMySchedule(userId: string) {
  const meetings = await prisma.meeting.findMany({
    where: { studentId: userId },
    orderBy: { start: 'desc' },
  });
  return meetings;
}

async function getMeetingHistory(userId: string) {
  const meetings = await prisma.meeting.findMany({
    where: { studentId: userId },
  });
  return meetings;
}

async function cancelMeeting(id: string) {
  const meeting = await prisma.meeting.update({
    where: { id },
    data: { status: false },
  });
  return meeting;
}

async function acceptMeeting(id: string, tutorId: string) {
  console.log('🚀 ~ acceptMeeting ~ id:', id);
  const meeting = await prisma.meeting.update({
    where: { id, tutorId },
    data: { accepted: true },
  });
  return meeting;
}

export default {
  createMeeting,
  getMyTutorSchedule,
  getMySchedule,
  getMeetingHistory,
  cancelMeeting,
  acceptMeeting,
};
