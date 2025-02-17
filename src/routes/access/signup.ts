import express from 'express';
import { SuccessResponse } from '../../core/ApiResponse';
import { RoleRequest } from 'app-request';
import crypto from 'crypto';
import UserRepo from '../../database/repository/UserRepo';
import { BadRequestError } from '../../core/ApiError';
// import User from '../../database/model/User';

import { createTokens } from '../../auth/authUtils';
import validator from '../../helpers/validator';
import schema from './schema';
import asyncHandler from '../../helpers/asyncHandler';
import bcrypt from 'bcrypt';
import { RoleCode } from '../../database/model/Role';
import { getUserData } from './utils';
import { User } from '@prisma/client';

const router = express.Router();

router.post(
  '/basic',
  validator(schema.signup),
  asyncHandler(async (req: RoleRequest, res) => {
    console.log('🚀 ~ asyncHandler ~ req.body:', req.body);
    const user = await UserRepo.findByEmail(req.body.email);
    console.log('🚀 ~ asyncHandler ~ user:', user);
    if (user) throw new BadRequestError('User already registered');

    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    console.log('🚀 ~ asyncHandler ~ accessTokenKey:', accessTokenKey);
    const refreshTokenKey = crypto.randomBytes(64).toString('hex');
    console.log('🚀 ~ asyncHandler ~ refreshTokenKey:', refreshTokenKey);
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    console.log('🚀 ~ asyncHandler ~ passwordHash:', passwordHash);

    const { user: createdUser, keystore } = await UserRepo.create(
      {
        name: req.body.name,
        email: req.body.email,
        profilePicUrl: req.body.profilePicUrl,
        password: passwordHash,
      } as User,
      accessTokenKey,
      refreshTokenKey,
      RoleCode.STAFF,
    );

    const tokens = await createTokens(
      createdUser,
      keystore.primaryKey,
      keystore.secondaryKey,
    );
    const userData = await getUserData(createdUser);

    new SuccessResponse('Signup Successful', {
      user: userData,
      tokens: tokens,
    }).send(res);
  }),
);

export default router;
