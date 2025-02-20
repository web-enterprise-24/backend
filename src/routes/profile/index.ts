import express from 'express';
import { SuccessResponse } from '../../core/ApiResponse';
import UserRepo from '../../database/repository/UserRepo';
import { ProtectedRequest, PublicRequest } from 'app-request';
import { BadRequestError } from '../../core/ApiError';
import validator from '../../helpers/validator';
import schema from './schema';
import crypto from 'crypto';
import asyncHandler from '../../helpers/asyncHandler';
import _ from 'lodash';
import bcrypt from 'bcrypt';
import authentication from '../../auth/authentication';
import { defaultPassword } from '../../config';
import { RoleCode } from '../../database/model/Role';
import { User } from '@prisma/client';
import RoleRepo from '../../database/repository/RoleRepo';

const router = express.Router();

/*-------------------------------------------------------------------------*/
router.use(authentication);
/*-------------------------------------------------------------------------*/

router.get(
  '/my',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const user = await UserRepo.findPrivateProfileById(req.user.id);
    if (!user) throw new BadRequestError('User not registered');

    return new SuccessResponse(
      'success',
      _.pick(user, ['id', 'name', 'profilePicUrl', 'email', 'dateOfBirth', 'gender', 'address', 'city', 'country', 'verified', 'status', 'createdAt', 'updatedAt', 'blogs', 'createdBlogs', 'updatedBlogs', 'keystores', 'roles']),
    ).send(res);
  }),
);

router.put(
  '/',
  validator(schema.profile),
  asyncHandler(async (req: ProtectedRequest, res) => {
    // const user = await UserRepo.findPrivateProfileById(req.user._id);
    const user = await UserRepo.findPrivateProfileById(req.user.id);
    if (!user) throw new BadRequestError('User not registered');

    if (req.body.name) user.name = req.body.name;
    if (req.body.profilePicUrl) user.profilePicUrl = req.body.profilePicUrl;

    await UserRepo.updateInfo(user);

    const data = _.pick(user, ['name', 'profilePicUrl']);

    return new SuccessResponse('Profile updated', data).send(res);
  }),
);

router.post(
  '/create',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const actionTriggerUser = await UserRepo.findByEmail(req.user.email || '');
    if (
      !actionTriggerUser?.roles.some((role) => role.code === RoleCode.STAFF)
    ) {
      throw new BadRequestError('You are not allowed to create student');
    }

    if (!req.body.role) throw new BadRequestError('Role is required');

    const user = await UserRepo.findByEmail(req.body.email);
    if (user) throw new BadRequestError('User already registered');
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    console.log('🚀 ~ asyncHandler ~ accessTokenKey:', accessTokenKey);

    const refreshTokenKey = crypto.randomBytes(64).toString('hex');

    const role = await RoleRepo.findByCode(req.body.role);
    if (!role) throw new BadRequestError('Role not found');

    const { user: createdUser } = await UserRepo.create(
      {
        name: req.body.name,
        email: req.body.email,
        profilePicUrl: req.body.profilePicUrl,
        password: passwordHash,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        address: req.body.address,
        city: req.body.city,
        country: req.body.country,
        requiredPasswordChange: true,
      } as User,
      accessTokenKey,
      refreshTokenKey,
      role.code,
    );
    return new SuccessResponse('Student created', createdUser).send(res);
  }),
);

router.get(
  '/roles',
  asyncHandler(async (req: PublicRequest, res) => {
    const roles = await RoleRepo.findAll();
    return new SuccessResponse('Roles fetched', roles).send(res);
  }),
);

export default router;
