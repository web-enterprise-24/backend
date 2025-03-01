import express from 'express';
import schema from './schema';
import validator from '../../helpers/validator';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import AllocateRepo from '../../database/repository/AllocateRepo';
import { SuccessResponse } from '../../core/ApiResponse';
import { NotFoundError } from '../../core/ApiError';
import authentication from '../../auth/authentication';

const router = express.Router();

router.use(authentication);

router.get(
  '/getMyTutor',

  asyncHandler(async (req: ProtectedRequest, res) => {
    const tutor = await AllocateRepo.getMyTutor(req.user.id);
    if (!tutor) throw new NotFoundError('You do not have a tutor');
    new SuccessResponse('Get my tutor', tutor).send(res);
  }),
);
router.post(
  '/',
  validator(schema.allocate),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { studentIds, tutorId } = req.body;
    const allocation = await AllocateRepo.allocateTutorWithManyStudents(
      tutorId,
      studentIds,
    );
    console.log('🚀 ~ asyncHandler ~ allocation:', allocation);

    new SuccessResponse('Allocate tutor', allocation).send(res);
  }),
);
export default router;
