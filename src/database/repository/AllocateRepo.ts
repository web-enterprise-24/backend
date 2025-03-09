import prisma from '../prismaClient';
import UserRepo from './UserRepo';
import _ from 'lodash';
import { RoleCode } from '../model/Role';
import { BadRequestError } from '../../core/ApiError';
import { sendEmail } from '../../helpers/nodemailer';

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

  // Get student and tutor information to send email
  const student = await UserRepo.findById(studentId);
  const tutor = await UserRepo.findById(tutorId);

  if (student && tutor) {
    const studentMessage = `
      <h3>Dear ${student.name},</h3>
      <p>You have been assigned to the tutor <strong>${tutor.name}</strong>.</p>
      <p>Please contact your tutor to begin your studies.</p>
    `;

    const tutorMessage = `
      <h3>Dear ${tutor.name},</h3>
      <p>The student <strong>${student.name}</strong> has been assigned to you.</p>
      <p>Please contact the student to provide guidance.</p>
    `;

    // Send email to student and tutor
    await Promise.all([
      await sendEmail(student.email, "Notice of tutor allocation", studentMessage),
      await sendEmail(tutor.email, "Notice of student allocation", tutorMessage),
    ]);
  }

  return { success: true, allocation };
}

async function allocateTutorWithManyStudents(tutorId: string, studentIds: string[]) 
{
  const successAllocate = [];
  const failedAllocate = [];

  for (const studentId of studentIds) {
    const allocate = await allocateTutor(studentId, tutorId);
    if (allocate.success) successAllocate.push(studentId);
    else failedAllocate.push({ studentId, message: allocate.message });
  }

  // Email tutor when assigning multiple students
  const tutor = await UserRepo.findById(tutorId);
  if (tutor && successAllocate.length > 0) {
    // Get the list of allocated students
    const allocatedStudents = await UserRepo.findManyByIds(successAllocate);
    const studentsList = allocatedStudents.map((student) => `<li>${student.name} - ${student.email}</li>`).join('');
    const tutorMessage = `
      <h3>Hello ${tutor.name},</h3>
      <p>You have been assigned additional students:</p>
      <ul>${studentsList}</ul>
      <p>Please contact the students to provide guidance.</p>
    `;

    await sendEmail(tutor.email, "Notice of additional student allocation", tutorMessage);
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

  // Get student information to send email
  const student = await UserRepo.findById(studentId);
  if (student && myTutor) {
    const studentMessage = `
      <h3>Dear ${student.name},</h3>
      <p>You have been unassigned from the tutor <strong>${myTutor.name}</strong>.</p>
      <p>Please wait for further notice on reallocation.</p>
    `;

    const tutorMessage = `
      <h3>Dear ${myTutor.name},</h3>
      <p>The student <strong>${student?.name}</strong> has been unassigned from you.</p>
      <p>They have been removed from your allocation list.</p>
    `;

    await Promise.all([
      sendEmail(student.email, "Notice of tutor allocation cancellation", studentMessage),
      sendEmail(myTutor.email, "Notice of student allocation cancellation", tutorMessage),
    ]);
  }

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
