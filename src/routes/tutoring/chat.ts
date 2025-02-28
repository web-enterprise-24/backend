import express from 'express';
import { ProtectedRequest } from '../../types/app-request';
import UserRepo from '../../database/repository/UserRepo';
import { BadRequestError } from '../../core/ApiError';
import validator from '../../helpers/validator';
import schema from './schema';

const router = express.Router();

router.get(
  '/',
  validator(schema.getChat),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const user = await UserRepo.findByEmail(req.user.email);
    if (!user) throw new BadRequestError('User do not exists');
  }),
);

export default router;
