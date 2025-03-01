import prisma from '../prismaClient';
import UserRepo from './UserRepo';
import { BadRequestError } from '../../core/ApiError';
import _ from 'lodash';
import { RoleCode } from '../model/Role';

async function getMyTutor(studentId: string) {
  const allocation = await prisma.allocation.findFirst({
    where: { studentId },
  });
  if (!allocation) return null;
  const tutor = await UserRepo.findById(allocation?.tutorId);
  return _.pick(tutor, ['id', 'name', 'email', 'profilePicUrl']);
}

async function allocateTutor(studentId: string, tutorId: string) {
  const getCurrentTutor = await getMyTutor(studentId);
  if (getCurrentTutor)
    return { success: false, message: 'Student already have a tutor' };

  const checkRole = await UserRepo.findPrivateProfileById(tutorId);
  if (!checkRole?.roles.some((role) => role.code === RoleCode.TUTOR))
    return { success: false, message: 'Tutor is not available' };

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
export default {
  getMyTutor,
  allocateTutor,
  changeTutor,
  allocateTutorWithManyStudents,
};
