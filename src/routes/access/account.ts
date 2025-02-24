import express from 'express';
import { ProtectedRequest, RoleRequest } from 'app-request';
import UserRepo from '../../database/repository/UserRepo';
import asyncHandler from '../../helpers/asyncHandler';
import authentication from '../../auth/authentication';
import { RoleCode } from '../../database/model/Role';
import { BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import validator from '../../helpers/validator';

const router = express.Router();

/*-------------------------------------------------------------------------*/
router.use(authentication);
/*-------------------------------------------------------------------------*/

router.put(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const actionTriggerUser = await UserRepo.findByEmail(req.user.email || '');
    if (
      !actionTriggerUser?.roles.some((role) => role.code === RoleCode.STAFF)
    ) {
      throw new BadRequestError('You are not authorized to perform this action');
    }

    const activeUser = await UserRepo.activeAccount(req.body.email, req.body.status);

    // return new SuccessResponse('Account status updated', activeUser).send(res);
    return new SuccessResponse(
      `Account ${req.body.status ? 'activated' : 'deactivated'} successfully`, 
      activeUser
    ).send(res);
  }),
);

export default router;