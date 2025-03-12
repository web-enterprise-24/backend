import express from 'express';
import { ProtectedRequest } from 'app-request';
import { AuthFailureError } from '../core/ApiError';
import RoleRepo from '../database/repository/RoleRepo';
import asyncHandler from '../helpers/asyncHandler';
import prisma from '../database/prismaClient';

const router = express.Router();

// export default router.use(
//   asyncHandler(async (req: ProtectedRequest, res, next) => {
//     if (!req.user || !req.user.roles || !req.currentRoleCodes)
//       throw new AuthFailureError('Permission denied');

//     const roles = await RoleRepo.findByCodes(req.currentRoleCodes);
//     if (roles.length === 0) throw new AuthFailureError('Permission denied');

//     let authorized = false;

//     for (const userRole of req.user.roles) {
//       if (authorized) break;
//       for (const role of roles) {
//         if (userRole._id.equals(role._id)) {
//           authorized = true;
//           break;
//         }
//       }
//     }

//     if (!authorized) throw new AuthFailureError('Permission denied');

//     return next();
//   }),
// );

export default router.use(
  asyncHandler(async (req: ProtectedRequest, res, next) => {
    if (
      !req.user ||
      // !req.user.roles ||
      !req.currentRoleCodes
    )
      throw new AuthFailureError('Permission denied');
    console.log(
      '🚀 ~ asyncHandler ~ req.currentRoleCodes:',
      req.currentRoleCodes,
    );
    const roles = await RoleRepo.findByCodes(req.currentRoleCodes);
    console.log('🚀 ~ asyncHandler ~ roles:', roles);
    if (roles.length === 0) throw new AuthFailureError('Permission denied');

    let authorized = false;

    const userRoles = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { roles: true },
    });

    for (const userRole of userRoles?.roles || []) {
      if (authorized) break;
      for (const role of roles) {
        console.log('🚀 ~ asyncHandler ~ role:', role);
        console.log('🚀 ~ asyncHandler ~ userRole:', userRole);
        if (userRole.id === role.id) {
          authorized = true;
          break;
        }
      }
    }

    if (!authorized) throw new AuthFailureError('Permission denied');

    return next();
  }),
);
