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
  '/tutorOverviewMetrics',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const tutorId = req.user.id;
    const metrics = await DashboardRepo.getTutorOverviewMetrics(tutorId);
    new SuccessResponse('Success', metrics).send(res);
  })
);

router.get(
  '/tuteesInformation',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const tutorId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.pageSize as string) || 5;
    const baseUrl = `https://${req.get('host')}${req.baseUrl}/tuteesInformation`;
    const tuteesInfo = await DashboardRepo.getTuteesInformation(tutorId, page, limit, baseUrl);
    new SuccessResponse('Success', tuteesInfo).send(res);
  })
);

router.get(
  '/upcomingMeetings',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const tutorId = req.user.id;
    const meetings = await DashboardRepo.getUpcomingMeetingsForTutor(tutorId);
    new SuccessResponse('Success', { meetings }).send(res);
  })
);

router.get(
  '/recentlyUploadedDocuments',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const tutorId = req.user.id;
    const documents = await DashboardRepo.getRecentlyUploadedDocuments(tutorId);
    new SuccessResponse('Success', { documents }).send(res);
  })
);

router.get(
  '/tuteesActivity',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const tutorId = req.user.id;
    const timeRange = (req.query.timeRange as string) || 'lastMonth';
    if (!['lastWeek', 'lastMonth'].includes(timeRange)) {
      throw new BadRequestError('Invalid time range');
    }
    const activity = await DashboardRepo.getTuteesActivity(tutorId, timeRange as 'lastWeek' | 'lastMonth');
    new SuccessResponse('Success', { activity }).send(res);
  })
);

router.get(
  '/documentFeedbackAnalytics',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const tutorId = req.user.id;
    const timeRange = (req.query.timeRange as string) || 'thisWeek';
    if (!['thisWeek', 'thisMonth'].includes(timeRange)) {
      throw new BadRequestError('Invalid time range');
    }
    const analytics = await DashboardRepo.getDocumentFeedbackAnalytics(tutorId, timeRange as 'thisWeek' | 'thisMonth');
    new SuccessResponse('Success', { analytics }).send(res);
  })
);

export default router;