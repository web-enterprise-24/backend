import express from 'express';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { SuccessResponse } from '../../core/ApiResponse';
import authentication from '../../auth/authentication';
import DashboardRepo from '../../database/repository/DashboardRepo';
import { BadRequestError } from '../../core/ApiError';

const router = express.Router();

router.use(authentication);

// // Get average number of messages of tutor
// router.get(
//   '/averageMessages',
//   asyncHandler(async (req: ProtectedRequest, res) => {
//     const average = await DashboardRepo.getAverageMessagesPerTutor();
//     new SuccessResponse('Success', { averageMessages: average }).send(res);
//   })
// );

// // Get average number of messages per day from a tutor over the last 7 days
// router.get(
//   '/tutorAverageMessages/:tutorId',
//   asyncHandler(async (req: ProtectedRequest, res) => {
//     const tutorId = req.params.tutorId;
//     const averageMessages = await DashboardRepo.getAverageMessagesForPersonalTutor(tutorId);
//     new SuccessResponse('Success', { averageMessages }).send(res);
//   })
// );

// // Get list of student without tutor
// router.get(
//   '/studentsWithoutTutor',
//   asyncHandler(async (req: ProtectedRequest, res) => {
//     const students = await DashboardRepo.getStudentsWithoutTutor();
//     new SuccessResponse('Success', { students }).send(res);
//   })
// );

// // Get list of inactive students
// router.get(
//   '/inactiveStudents',
//   asyncHandler(async (req: ProtectedRequest, res) => {
//     const days = parseInt(req.query.days as string, 10);

//     if (isNaN(days) || days <= 0) {
//       throw new BadRequestError('Invalid number of days');
//     }
//     const students = await DashboardRepo.getInactiveStudents(days);
//     new SuccessResponse('Success', { students }).send(res);
//   })
// );

// // Get interaction information of a tutor
// router.get(
//   '/tutorInteractions/:tutorId',
//   asyncHandler(async (req: ProtectedRequest, res) => {
//     const tutorId = req.params.tutorId;
//     const interactions = await DashboardRepo.getTutorInteractions(tutorId);
//     new SuccessResponse('Success', { interactions }).send(res);
//   })
// );

// // Get interaction information of a student
// router.get(
//   '/studentInteractions/:studentId',
//   asyncHandler(async (req: ProtectedRequest, res) => {
//     const studentId = req.params.studentId;
//     const interactions = await DashboardRepo.getStudentInteractions(studentId);
//     new SuccessResponse('Success', { interactions }).send(res);
//   })
// );



router.get(
  '/overviewMetrics',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const metrics = await DashboardRepo.getOverviewMetrics();
    new SuccessResponse('Success', metrics).send(res);
  })
);

router.get(
  '/tutorActivity',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const activity = await DashboardRepo.getTutorActivity();
    new SuccessResponse('Success', { activity }).send(res);
  })
);

router.get(
  '/tutorPerformance',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const performance = await DashboardRepo.getTutorPerformance();
    new SuccessResponse('Success', { performance }).send(res);
  })
);

export default router;