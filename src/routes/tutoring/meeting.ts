/* Requirements:
model Meeting {
  id        String   @id @default(cuid())
  studentId String
  tutorId   String
  start   DateTime
  end     DateTime
  status    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  student   User     @relation(name: "StudentMeetings", fields: [studentId], references: [id])
  tutor     User     @relation(name: "TutorMeetings", fields: [tutorId], references: [id])
}
- I can see my tutor schedule
- I can book a meeting with my tutor
- I can see my meeting history
- I can cancel a meeting
- I can see my meeting details

*/

import { Router } from 'express';
import MeetingRepo from '../../database/repository/MeetingRepo';
import authentication from '../../auth/authentication';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { SuccessResponse } from '../../core/ApiResponse';
import role from '../../helpers/role';
import { RoleCode } from '../../database/model/Role';

const router = Router();

router.use(authentication);
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
    const meetings = await MeetingRepo.getMySchedule(userId);
    new SuccessResponse('Meeting schedule', meetings).send(res);
  }),
);

// role student
router.use(role(RoleCode.STUDENT));
router.post(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { start, end } = req.body;
    const meeting = await MeetingRepo.createMeeting(req.user.id, start, end);
    new SuccessResponse('Meeting booked', meeting).send(res);
  }),
);

router.get(
  '/history',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { userId } = req.params;
    const meetings = await MeetingRepo.getMeetingHistory(userId);
    new SuccessResponse('Meeting history', meetings).send(res);
  }),
);

router.post(
  '/cancel',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { meetingId } = req.body;
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
