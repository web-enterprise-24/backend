import prisma from '../prismaClient';
import UserRepo from './UserRepo';
import _ from 'lodash';
import { RoleCode } from '../model/Role';
import { BadRequestError } from '../../core/ApiError';

async function getMyTutor(studentId: string) {
  const allocation = await prisma.allocation.findFirst({
    where: { studentId },
  });
  console.log('🚀 ~ getMyTutor ~ allocation:', allocation);
  if (!allocation) {
    console.error('Allocation not found');
    return null;
  }
  const tutor = await UserRepo.findById(allocation?.tutorId ?? '');
  if (!tutor) {
    console.error('Tutor not found');
    return null;
  }
  return _.pick(tutor, ['id', 'name', 'email', 'profilePicUrl']);
}

async function getMyStudent(tutorId: string) {
  const allocation = await prisma.allocation.findMany({
    where: { tutorId },
  });
  if (!allocation) {
    console.error('Allocation not found');
    return null;
  }
  const students = await UserRepo.findManyByIds(
    allocation.map((item) => item.studentId),
  );
  return students;
}

async function allocateTutor(studentId: string, tutorId: string) {
  const getCurrentTutor = await getMyTutor(studentId);
  if (getCurrentTutor) {
    console.error('Student already have a tutor');
    return { success: false, message: 'Student already have a tutor' };
  }

  const checkRole = await UserRepo.findPrivateProfileById(tutorId);
  if (!checkRole?.roles.some((role) => role.code === RoleCode.TUTOR)) {
    console.error('Tutor is not available');
    return { success: false, message: 'Tutor is not available' };
  }

  const allocation = await prisma.allocation.create({
    data: { studentId, tutorId, startAt: new Date() },
  });
  return { success: true, allocation };
}

async function allocateTutorWithManyStudents(
  tutorId: string,
  studentIds: string[],
) {
  const successAllocate = [];
  const failedAllocate = [];
  for (const studentId of studentIds) {
    const allocate = await allocateTutor(studentId, tutorId);
    if (allocate.success) successAllocate.push(studentId);
    else failedAllocate.push({ studentId, message: allocate.message });
  }
  return { successAllocate, failedAllocate };
}

async function changeTutor(studentId: string, tutorId: string) {
  const allocation = await prisma.allocation.update({
    where: { studentId },
    data: { tutorId, startAt: new Date() },
  });
  return allocation;
}

async function unallocateTutor(studentId: string) {
  const myTutor = await getMyTutor(studentId);
  console.log('🚀 ~ unallocateTutor ~ myTutor:', myTutor);
  if (!myTutor) throw new BadRequestError('Student does not have a tutor');
  const allocation = await prisma.allocation.delete({
    where: { studentId },
  });
  const allocationHistory = await prisma.allocationHistory.create({
    data: {
      tutorId: myTutor.id,
      startAt: allocation.startAt,
      endAt: new Date(),
    },
  });
  return { message: 'Unallocate tutor', allocationHistory };
}

export default {
  getMyTutor,
  getMyStudent,
  allocateTutor,
  unallocateTutor,
  changeTutor,
  allocateTutorWithManyStudents,
};
