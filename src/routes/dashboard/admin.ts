import express from 'express';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { SuccessResponse } from '../../core/ApiResponse';
import authentication from '../../auth/authentication';
import DashboardRepo from '../../database/repository/DashboardRepo';
import { RoleCode } from '../../database/model/Role';
import role from '../../helpers/role';
import authorization from '../../auth/authorization';
import { UAParser } from 'ua-parser-js';

const router = express.Router();

router.post(
  '/statistic',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { pageKey } = req.body;
    const parser = new UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser().name || 'Unknown';
    await DashboardRepo.createStatistic(pageKey, req.user.id, browser);
    new SuccessResponse('Saved successfully', { pageKey }).send(res);
  }),
);

router.use(authentication, role(RoleCode.STAFF), authorization);

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

router.get(
  '/viewTutorDashboard/:tutorId',
  asyncHandler(async (req, res) => {
    const tutorId = req.params.tutorId;

    // Get dashboard data of tutor
    const metrics = await DashboardRepo.getTutorOverviewMetrics(tutorId);
    // const tutees = await DashboardRepo.getTuteesInformation(tutorId, 1, 10, req.baseUrl);
    const tutees = await DashboardRepo.getTuteesInformation(tutorId);
    const upcomingMeetings = await DashboardRepo.getUpcomingMeetingsForTutor(tutorId);
    const recentDocuments = await DashboardRepo.getRecentlyUploadedDocuments(tutorId);
    const tuteesActivity = await DashboardRepo.getTuteesActivity(tutorId, 'lastMonth');
    const documentFeedback = await DashboardRepo.getDocumentFeedbackAnalytics(tutorId, 'thisMonth');

    new SuccessResponse('Success', {
      metrics,
      tutees,
      upcomingMeetings,
      recentDocuments,
      tuteesActivity,
      documentFeedback
    }).send(res);
  })
);

router.get(
  '/viewStudentDashboard/:studentId',
  asyncHandler(async (req, res) => {
    const studentId = req.params.studentId;

    // Get dashboard data of student
    const tutorProfile = await DashboardRepo.getTutorProfile(studentId);
    const metrics = await DashboardRepo.getStudentOverviewMetrics(studentId);
    const upcomingMeetings = await DashboardRepo.getUpcomingMeetingsForStudent(studentId);
    const recentDocuments = await DashboardRepo.getRecentDocuments(studentId);
    const activity = await DashboardRepo.getStudentActivity(studentId, 'lastMonth');

    new SuccessResponse('Success', {
      tutorProfile,
      metrics,
      upcomingMeetings,
      recentDocuments,
      activity
    }).send(res);
  })
);

router.get(
  '/viewStaffDashboard/:staffId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const staffId = req.params.staffId;

    const dashboardData = await DashboardRepo.getStaffDashboard(staffId);

    new SuccessResponse('Success', dashboardData).send(res);
  })
);

router.get(
  '/userLoginStats',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const userStats = await DashboardRepo.getUserLoginStats();
    new SuccessResponse('Success', { userStats }).send(res);
  })
);

router.get(
  '/userActivityStats',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const mostActiveUsers = await DashboardRepo.getMostActiveUsersByRole();
    const mostAccessedPages = await DashboardRepo.getMostAccessedPages();
    const mostUsedBrowsers = await DashboardRepo.getMostUsedBrowsers();
    new SuccessResponse('Success', { mostActiveUsers, mostAccessedPages, mostUsedBrowsers }).send(res);
  })
);

router.get(
  '/getActiveUsers',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const activeUsers = await DashboardRepo.getMostActiveUsersByRole();
    new SuccessResponse('Success', { activeUsers }).send(res);
  })
);

router.get(
  '/getAccessedPages',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const accessedPages = await DashboardRepo.getMostAccessedPages();
    new SuccessResponse('Success', { accessedPages }).send(res);
  })
);

router.get(
  '/getUsedBrowsers',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const usedBrowsers = await DashboardRepo.getMostUsedBrowsers();
    new SuccessResponse('Success', { usedBrowsers }).send(res);
  })
);

router.get(
  '/allocationCreators',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const allocationCreators = await DashboardRepo.getAllocationCreators();
    new SuccessResponse('Success', { allocationCreators }).send(res);
  })
);

router.get(
  '/allocationCancelers',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const allocationCancelers = await DashboardRepo.getAllocationCancelers();
    new SuccessResponse('Success', { allocationCancelers }).send(res);
  })
);

export default router;