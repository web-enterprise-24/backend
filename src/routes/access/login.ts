import express from 'express';
import { SuccessResponse } from '../../core/ApiResponse';
import crypto from 'crypto';
import UserRepo from '../../database/repository/UserRepo';
import { BadRequestError, AuthFailureError } from '../../core/ApiError';
import KeystoreRepo from '../../database/repository/KeystoreRepo';
import { createTokens } from '../../auth/authUtils';
import validator from '../../helpers/validator';
import schema from './schema';
import asyncHandler from '../../helpers/asyncHandler';
import bcrypt from 'bcrypt';
import { getUserData } from './utils';
import { PublicRequest } from '../../types/app-request';
import prisma from '../../database/prismaClient';
import { UAParser } from 'ua-parser-js';

const router = express.Router();

// router.post(
//   '/basic',
//   validator(schema.credential),
//   asyncHandler(async (req: PublicRequest, res) => {
//     const user = await UserRepo.findByEmail(req.body.email);
//     if (!user) throw new BadRequestError('User not registered');
//     if (!user.password) throw new BadRequestError('Credential not set');
//     if (!user.status) throw new BadRequestError('Account not active');

//     const match = await bcrypt.compare(req.body.password, user.password);
//     if (!match) throw new AuthFailureError('Authentication failure');

//     const accessTokenKey = crypto.randomBytes(64).toString('hex');
//     const refreshTokenKey = crypto.randomBytes(64).toString('hex');

//     await KeystoreRepo.create(user, accessTokenKey, refreshTokenKey);
//     const tokens = await createTokens(user, accessTokenKey, refreshTokenKey);
//     const userData = await getUserData(user);

//     new SuccessResponse('Login Success', {
//       user: userData,
//       tokens: tokens,
//     }).send(res);
//   }),
// );

router.post(
  '/basic',
  validator(schema.credential),
  asyncHandler(async (req: PublicRequest, res) => {
    const user = await UserRepo.findByEmail(req.body.email);
    if (!user) throw new BadRequestError('User not registered');
    if (!user.password) throw new BadRequestError('Credential not set');
    if (!user.status) throw new BadRequestError('Account not active');

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) throw new AuthFailureError('Authentication failure');

    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    const refreshTokenKey = crypto.randomBytes(64).toString('hex');

    await KeystoreRepo.create(user, accessTokenKey, refreshTokenKey);
    const tokens = await createTokens(user, accessTokenKey, refreshTokenKey);
    const userData = await getUserData(user);

    // Log login events
    const parser = new UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser().name || 'Unknown';

    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType: 'LOGIN',
        browser,
      },
    });

    new SuccessResponse('Login Success', {
      user: userData,
      tokens: tokens,
    }).send(res);
  }),
);

export default router;
