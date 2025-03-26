import { Router } from 'express';
import MeetingRepo from '../../database/repository/MeetingRepo';
import authentication from '../../auth/authentication';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { SuccessResponse } from '../../core/ApiResponse';
import role from '../../helpers/role';
import { RoleCode } from '../../database/model/Role';
import schema from './schema';
import validator from '../../helpers/validator';
import authorization from '../../auth/authorization';
import UserRepo from '../../database/repository/UserRepo';
import { BadRequestError } from '../../core/ApiError';

const router = Router();

router.use(authentication);
router.use(role(RoleCode.STUDENT, RoleCode.TUTOR));
router.use(authorization);
// router.post(
//   '/',
//   validator(schema.allocate),
//   asyncHandler(async (req: ProtectedRequest, res) => {
//     const { studentIds, tutorId } = req.body;
//     console.log('🚀 ~ asyncHandler ~ studentIds:', studentIds);
//     const allocation = await AllocateRepo.allocateTutorWithManyStudents(
//       tutorId,
//       studentIds,
//     );
//     console.log('🚀 ~ asyncHandler ~ allocation:', allocation);

//     new SuccessResponse('Allocate tutor', allocation).send(res);
//   }),
// );

router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { userId } = req.params;

    const actionTriggerUser = await UserRepo.findByEmail(req.user.email || '');
    console.log(
      '🚀 ~ asyncHandler ~ actionTriggerUser:',
      actionTriggerUser?.id,
    );
    if (!actionTriggerUser) {
      throw new BadRequestError('User not found');
    }
    const isTutor = actionTriggerUser?.roles.some(
      (role) => role.code === RoleCode.TUTOR,
    );
    const meetings = await MeetingRepo.getMySchedule(isTutor, userId);
    new SuccessResponse('Meeting schedule', meetings).send(res);
  }),
);

router.get(
  '/tutor',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const actionTriggerUser = await UserRepo.findByEmail(req.user.email || '');
    if (
      !actionTriggerUser?.roles.some((role) => role.code === RoleCode.STUDENT)
    ) {
      throw new BadRequestError(
        'You are not authorized to perform this action',
      );
    }
    const meetings = await MeetingRepo.getMyTutorSchedule(req.user.id);
    new SuccessResponse('Meeting schedule', meetings).send(res);
  }),
);

router.post(
  '/',
  validator(schema.createMeeting),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { start, end, title, studentId } = req.body;
    console.log('🚀 ~ asyncHandler ~ studentId:', studentId);
    const actionTriggerUser = await UserRepo.findByEmail(req.user.email || '');
    const isTutor = actionTriggerUser?.roles.some(
      (role) => role.code === RoleCode.TUTOR,
    );
    if (isTutor && studentId) {
      const meeting = await MeetingRepo.createMeeting(
        req.user.id,
        start,
        end,
        title,
        studentId,
        isTutor,
      );
      new SuccessResponse('Meeting booked', meeting).send(res);
    } else {
      throw new BadRequestError('Student ID is required');
    }
  }),
);

router.post(
  '/record',
  validator(schema.updateFileUrl),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const actionTriggerUser = await UserRepo.findByEmail(req.user.email || '');
    if (
      !actionTriggerUser?.roles.some((role) => role.code === RoleCode.TUTOR)
    ) {
      throw new BadRequestError(
        'You are not authorized to perform this action',
      );
    }
    const { meetingId, fileUrl } = req.body;
    const meeting = await MeetingRepo.updateFileUrl(meetingId, fileUrl);
    new SuccessResponse('Meeting record updated', meeting).send(res);
  }),
);

router.post(
  '/accept',
  validator(schema.acceptMeeting),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { meetingId } = req.body;
    console.log('🚀 ~ asyncHandler ~ meetingId:', meetingId);
    const tutorId = req.user.id;
    const actionTriggerUser = await UserRepo.findByEmail(req.user.email || '');
    if (
      !actionTriggerUser?.roles.some((role) => role.code === RoleCode.TUTOR)
    ) {
      throw new BadRequestError(
        'You are not authorized to perform this action',
      );
    }
    const meeting = await MeetingRepo.acceptMeeting(meetingId, tutorId);
    new SuccessResponse('Meeting accepted', meeting).send(res);
  }),
);
router.get(
  '/history',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { userId } = req.params;
    // check if user is tutor or student
    const actionTriggerUser = await UserRepo.findByEmail(req.user.email || '');
    if (!actionTriggerUser) {
      throw new BadRequestError('User not found');
    }
    const isTutor = actionTriggerUser?.roles.some(
      (role) => role.code === RoleCode.TUTOR,
    );
    const meetings = await MeetingRepo.getMeetingHistory(isTutor, userId);
    new SuccessResponse('Meeting history', meetings).send(res);
  }),
);

router.delete(
  '/cancel',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { meetingId } = req.body;
    // check role must be tutor
    const actionTriggerUser = await UserRepo.findByEmail(req.user.email || '');
    console.log(
      '🚀 ~ asyncHandler ~ actionTriggerUser:',
      actionTriggerUser?.id,
    );
    if (
      !actionTriggerUser?.roles.some((role) => role.code === RoleCode.TUTOR)
    ) {
      throw new BadRequestError(
        'You are not authorized to perform this action',
      );
    }
    const meeting = await MeetingRepo.cancelMeeting(meetingId);
    new SuccessResponse('Meeting cancelled', meeting).send(res);
  }),
);

// router.get(
//   '/details',
//   asyncHandler(async (req: ProtectedRequest, res) => {
//     const { meetingId } = req.params;
//     const meeting = await MeetingRepo.getMeetingDetails(meetingId);
//     new SuccessResponse('Meeting details', meeting).send(res);
//   }),
// );

export default router;
