import express from 'express';
import { ProtectedRequest } from '../../types/app-request';
import UserRepo from '../../database/repository/UserRepo';
import { BadRequestError } from '../../core/ApiError';
import validator from '../../helpers/validator';
import schema from './schema';
import asyncHandler from '../../helpers/asyncHandler';
import { SuccessResponse } from '../../core/ApiResponse';
import _ from 'lodash';

const router = express.Router();

router.get(
  '/',
  validator(schema.getChat),
  asyncHandler(async (req: ProtectedRequest, res) => {
    console.log('🚀 ~ asyncHandler ~ res:', res);
    const user = await UserRepo.findByEmail(req.user.email);
    if (!user) throw new BadRequestError('User do not exists');
    new SuccessResponse(
      'User password updated',
      _.pick(user, ['id', 'name', 'email']),
    ).send(res);
  }),
);

export default router;
