import express from 'express';
import { SuccessResponse } from '../../core/ApiResponse';
import { ProtectedRequest, RoleRequest } from 'app-request';
import UserRepo from '../../database/repository/UserRepo';
import { BadRequestError } from '../../core/ApiError';
// import User from '../../database/model/User';
import { User } from '@prisma/client';
import validator from '../../helpers/validator';
import schema from './schema';
import asyncHandler from '../../helpers/asyncHandler';
import bcrypt from 'bcrypt';
import _ from 'lodash';
// import { RoleCode } from '../../database/model/Role';
// import role from '../../helpers/role';
// import authorization from '../../auth/authorization';
import authentication from '../../auth/authentication';
import KeystoreRepo from '../../database/repository/KeystoreRepo';

const router = express.Router();

//----------------------------------------------------------------
// router.use(authentication, role(RoleCode.STAFF), authorization);
router.use(authentication);
//----------------------------------------------------------------

router.post(
  '/user/change-password',
  validator(schema.changePassword),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const user = await UserRepo.findByEmail(req.user.email);
    if (!user) throw new BadRequestError('User do not exists');

    const match = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!match) throw new BadRequestError('Old password is incorrect');

    const passwordHash = await bcrypt.hash(req.body.newPassword, 10);

    await UserRepo.updateInfo({
      id: user.id,
      password: passwordHash,
    } as User);

    await KeystoreRepo.removeAllForClient(user);

    new SuccessResponse(
      'User password updated',
      _.pick(user, ['id', 'name', 'email']),
    ).send(res);
  }),
);

export default router;
