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
    const { studentIds, tutorId } = req.body;
    console.log('🚀 ~ asyncHandler ~ studentIds:', studentIds);
    const allocation = await AllocateRepo.allocateTutorWithManyStudents(
      tutorId,
      studentIds,
    );
    console.log('🚀 ~ asyncHandler ~ allocation:', allocation);

    new SuccessResponse('Allocate tutor', allocation).send(res);
  }),
);

router.delete(
  '/:studentId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { studentId } = req.params;
    const allocation = await AllocateRepo.unallocateTutor(studentId);
    new SuccessResponse('Deallocate tutor', allocation).send(res);
  }),
);

export default router;
