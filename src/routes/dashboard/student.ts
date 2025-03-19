import express from 'express';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { SuccessResponse } from '../../core/ApiResponse';
import authentication from '../../auth/authentication';
import DashboardRepo from '../../database/repository/DashboardRepo';
import { BadRequestError } from '../../core/ApiError';

const router = express.Router();

router.use(authentication);

router.get(
  '/studentProfile',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const studentId = req.user.id;
    const profile = await DashboardRepo.getStudentProfile(studentId);
    new SuccessResponse('Success', profile).send(res);
  })
);

router.get(
  '/studentOverviewMetrics',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const studentId = req.user.id;
    const metrics = await DashboardRepo.getStudentOverviewMetrics(studentId);
    new SuccessResponse('Success', metrics).send(res);
  })
);

router.get(
  '/recentDocuments',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const studentId = req.user.id;
    const documents = await DashboardRepo.getRecentDocuments(studentId);
    new SuccessResponse('Success', { documents }).send(res);
  })
);

router.get(
  '/studentActivity',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const studentId = req.user.id;
    const timeRange = (req.query.timeRange as string) || 'lastMonth'; // Default to lastMonth
    if (!['lastWeek', 'lastMonth'].includes(timeRange)) {
      throw new BadRequestError('Invalid time range');
    }
    const activity = await DashboardRepo.getStudentActivity(studentId, timeRange as 'lastWeek' | 'lastMonth');
    new SuccessResponse('Success', activity).send(res);
  })
);

export default router;