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
    // const studentMessage = `
    //   <h3>Dear ${student.name},</h3>
    //   <p>You have been assigned to the tutor <strong>${tutor.name}</strong>.</p>
    //   <p>Please contact your tutor to begin your studies.</p>
    // `;

    // const tutorMessage = `
    //   <h3>Dear ${tutor.name},</h3>
    //   <p>The student <strong>${student.name}</strong> has been assigned to you.</p>
    //   <p>Please contact the student to provide guidance.</p>
    // `;

    const studentMessage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Student Assignment Notification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border: 1px solid #e0e0e0;
            }
            .header {
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
            }
            .header h1 {
                font-size: 24px;
                margin: 0;
                text-align: center;
            }
            .content {
                padding: 20px;
                text-align: center;
            }
            .content h3 {
                font-size: 18px;
                color: #333333;
                margin: 0 0 10px 0;
            }
            .content p {
                font-size: 16px;
                color: #333333;
                margin: 0 0 10px 0;
            }
            .greeting {
                  font-size: 18px;
                  font-weight: bold;
                  color: #333333;
            }
            .footer {
                padding: 20px;
                font-size: 12px;
                color: #666666;
                text-align: center;
                border-top: 1px solid #e0e0e0;
            }
            .footer a {
                color: #1a73e8;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>eTUTORING</h1>
            </div>
            <div class="content">
                <p>Dear <span class="greeting">${student.name}</span>,</p>
                <p>You have been assigned to the tutor <strong>${tutor.name}</strong>.</p>
                <p>Please contact your tutor to begin your studies.</p>
            </div>
            <div class="footer">
                <p><a href="#">University of Greenwich Vietnam </a></p>
                <p><a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a></p>
            </div>
        </div>
    </body>
    </html>
    `;

    const tutorMessage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tutor Assignment Notification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border: 1px solid #e0e0e0;
            }
            .header {
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
            }
            .header h1 {
                font-size: 24px;
                margin: 0;
                text-align: center;
            }
            .content {
                padding: 20px;
                text-align: center;
            }
            .content h3 {
                font-size: 18px;
                color: #333333;
                margin: 0 0 10px 0;
            }
            .content p {
                font-size: 16px;
                color: #333333;
                margin: 0 0 10px 0;
            }
            .greeting {
                  font-size: 18px;
                  font-weight: bold;
                  color: #333333;
            }
            .footer {
                padding: 20px;
                font-size: 12px;
                color: #666666;
                text-align: center;
                border-top: 1px solid #e0e0e0;
            }
            .footer a {
                color: #1a73e8;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>eTUTORING</h1>
            </div>
            <div class="content">
                <p>Dear <span class="greeting">${tutor.name}</span>,</p>
                <p>The student <strong>${student.name}</strong> has been assigned to you.</p>
                <p>Please contact the student to provide guidance.</p>
            </div>
            <div class="footer">
                <p><a href="#">University of Greenwich Vietnam</a></p>
                <p><a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a></p>
            </div>
        </div>
    </body>
    </html>
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
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tutor Assignment Notification</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f4f4f4;
              }
              .container {
                  width: 100%;
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border: 1px solid #e0e0e0;
              }
              .header {
                  padding: 20px;
                  border-bottom: 1px solid #e0e0e0;
              }
              .header h1 {
                  font-size: 24px;
                  margin: 0;
                  text-align: center;
              }
              .content {
                  padding: 20px;
                  text-align: center;
              }
              .content p {
                  font-size: 16px;
                  color: #333333;
                  margin: 0 0 10px 0;
              }
              .greeting {
                  font-size: 18px;
                  font-weight: bold;
                  color: #333333;
              }
              .content ul {
                  list-style-type: none;
                  padding: 0;
                  margin: 10px 0;
              }
              .content li {
                  font-size: 16px;
                  color: #333333;
                  margin: 5px 0;
              }
              .footer {
                  padding: 20px;
                  font-size: 12px;
                  color: #666666;
                  text-align: center;
                  border-top: 1px solid #e0e0e0;
              }
              .footer a {
                  color: #1a73e8;
                  text-decoration: none;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>eTUTORING</h1>
              </div>
              <div class="content">
                  <p>Hello <span class="greeting">${tutor.name}</span>,</p>
                  <p>You have been assigned additional students:</p>
                  <ul>${studentsList}</ul>
                  <p>Please contact the students to provide guidance.</p>
              </div>
              <div class="footer">
                  <p><a href="#">University of Greenwich Vietnam</a></p>
                  <p><a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a></p>
              </div>
          </div>
      </body>
      </html>
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
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Student Unassignment Notification</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f4f4f4;
              }
              .container {
                  width: 100%;
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border: 1px solid #e0e0e0;
              }
              .header {
                  padding: 20px;
                  border-bottom: 1px solid #e0e0e0;
              }
              .header h1 {
                  font-size: 24px;
                  margin: 0;
                  text-align: center;
              }
              .content {
                  padding: 20px;
                  text-align: center;
              }
              .content p {
                  font-size: 16px;
                  color: #333333;
                  margin: 0 0 10px 0;
              }
              .greeting {
                  font-size: 18px;
                  font-weight: bold;
                  color: #333333;
              }
              .footer {
                  padding: 20px;
                  font-size: 12px;
                  color: #666666;
                  text-align: center;
                  border-top: 1px solid #e0e0e0;
              }
              .footer a {
                  color: #1a73e8;
                  text-decoration: none;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>eTUTORING</h1>
              </div>
              <div class="content">
                  <p>Dear <span class="greeting">${student.name}</span>,</p>
                  <p>You have been unassigned from the tutor <strong>${myTutor.name}</strong>.</p>
                  <p>Please wait for further notice on reallocation.</p>
              </div>
              <div class="footer">
                  <p><a href="#">University of Greenwich Vietnam</a></p>
                  <p><a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a></p>
              </div>
          </div>
      </body>
      </html>
      `;

    const tutorMessage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tutor Unassignment Notification</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f4f4f4;
              }
              .container {
                  width: 100%;
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border: 1px solid #e0e0e0;
              }
              .header {
                  padding: 20px;
                  border-bottom: 1px solid #e0e0e0;
              }
              .header h1 {
                  font-size: 24px;
                  margin: 0;
                  text-align: center;
              }
              .content {
                  padding: 20px;
                  text-align: center;
              }
              .content p {
                  font-size: 16px;
                  color: #333333;
                  margin: 0 0 10px 0;
              }
              .greeting {
                  font-size: 18px;
                  font-weight: bold;
                  color: #333333;
              }
              .footer {
                  padding: 20px;
                  font-size: 12px;
                  color: #666666;
                  text-align: center;
                  border-top: 1px solid #e0e0e0;
              }
              .footer a {
                  color: #1a73e8;
                  text-decoration: none;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>eTUTORING</h1>
              </div>
              <div class="content">
                  <p>Dear <span class="greeting">${myTutor.name}</span>,</p>
                  <p>The student <strong>${student?.name}</strong> has been unassigned from you.</p>
                  <p>They have been removed from your allocation list.</p>
              </div>
              <div class="footer">
                  <p><a href="#">University of Greenwich Vietnam</a></p>
                  <p><a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a></p>
              </div>
          </div>
      </body>
      </html>
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
