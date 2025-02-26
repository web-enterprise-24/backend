import express from 'express';
import { ProtectedRequest, RoleRequest } from 'app-request';
import UserRepo from '../../database/repository/UserRepo';
import asyncHandler from '../../helpers/asyncHandler';
import authentication from '../../auth/authentication';
import { RoleCode } from '../../database/model/Role';
import { BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import validator from '../../helpers/validator';
import schema from './schema';

const router = express.Router();

/*-------------------------------------------------------------------------*/
router.use(authentication);
/*-------------------------------------------------------------------------*/

//updateAccountStatus
router.patch(
  '/:userId',
  validator(schema.account),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { userId } = req.params;

    const actionTriggerUser = await UserRepo.findByEmail(req.user.email || '');
    if (
      !actionTriggerUser?.roles.some((role) => role.code === RoleCode.STAFF)
    ) {
      throw new BadRequestError('You are not authorized to perform this action');
    }

    const activeUser = await UserRepo.activeAccount(userId, req.body.status);

    // return new SuccessResponse('Account status updated', activeUser).send(res);
    return new SuccessResponse(
      `Account ${req.body.status ? 'activated' : 'deactivated'} successfully`, 
      activeUser
    ).send(res);
  }),
);

//getUsersByRole
// router.get(
//   '/',
//   asyncHandler(async (req: ProtectedRequest, res) => {
//     const actionTriggerUser = await UserRepo.findByEmail(req.user.email);
//     if (!actionTriggerUser?.roles.some(role => role.code === RoleCode.STAFF)) {
//       throw new BadRequestError('Permission denied');
//     }

//     const roleCode = req.query.role as RoleCode;
//     const users = await UserRepo.findByRole(roleCode);
    
//     // return new SuccessResponse('Users retrieved successfully', users).send(res);
//     return new SuccessResponse('Users retrieved successfully', {
//       result: users.length,
//       data: users
//     }).send(res);
//   }),
// );

router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const actionTriggerUser = await UserRepo.findByEmail(req.user.email);
    if (!actionTriggerUser?.roles.some(role => role.code === RoleCode.STAFF)) {
      throw new BadRequestError('Permission denied');
    }

    // Get pagination parameters from query
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const roleCode = req.query.role as RoleCode;
    
    // Get total count and paginated users
    const [users, total] = await Promise.all([
      UserRepo.findByRole(roleCode, skip, limit),
      UserRepo.countByRole(roleCode)
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Build pagination links
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    const pagination = {
      next: page < totalPages 
        ? `${baseUrl}?page=${page + 1}&limit=${limit}&role=${roleCode}`
        : null,
      previous: page > 1
        ? `${baseUrl}?page=${page - 1}&limit=${limit}&role=${roleCode}`
        : null
    };
    
    return new SuccessResponse('Users retrieved successfully', {
      result: users.length,
      totalUsers: total,
      page,
      limit,
      totalPages,
      pagination,
      data: users
    }).send(res);
  }),
);

export default router;