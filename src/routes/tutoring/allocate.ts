import express from 'express';
import schema from './schema';
import validator from '../../helpers/validator';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import AllocateRepo from '../../database/repository/AllocateRepo';
import { SuccessResponse } from '../../core/ApiResponse';
import authentication from '../../auth/authentication';

const router = express.Router();

router.use(authentication);

router.post(
  '/',
  validator(schema.allocate),
  asyncHandler(async (req: ProtectedRequest, res) => {
    console.log('🚀 ~ req.user:', req.user);
    const { studentIds, tutorId } = req.body;
    const staffId = req.user.id;
    console.log('🚀 ~ staffId:', staffId);
    console.log('🚀 ~ asyncHandler ~ studentIds:', studentIds);
    const allocation = await AllocateRepo.allocateTutorWithManyStudents(
      tutorId,
      studentIds,
      staffId,
    );
    console.log('🚀 ~ asyncHandler ~ allocation:', allocation);

    new SuccessResponse('Allocate tutor', allocation).send(res);
  }),
);

router.delete(
  '/:studentId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { studentId } = req.params;
    const staffId = req.user.id;
    const allocation = await AllocateRepo.unallocateTutor(studentId, staffId);
    new SuccessResponse('Deallocate tutor', allocation).send(res);
  }),
);

export default router;
