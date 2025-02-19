import express from 'express';
import asyncHandler from '../../helpers/asyncHandler';
import { PublicRequest } from '../../types/app-request';
import RoleRepo from '../../database/repository/RoleRepo';
import { SuccessResponse } from '../../core/ApiResponse';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req: PublicRequest, res) => {
    const roles = await RoleRepo.findAll();
    return new SuccessResponse('Roles fetched', roles).send(res);
  }),
);

export default router;
