// import Role, { RoleModel } from '../model/Role';
import { Role } from '@prisma/client';
import prisma from '../prismaClient';

// async function findByCode(code: string): Promise<Role | null> {
//   return RoleModel.findOne({ code: code, status: true }).lean().exec();
// }

async function findByCode(code: string): Promise<Role | null> {
  return prisma.role.findUnique({ where: { code } });
}

// async function findByCodes(codes: string[]): Promise<Role[]> {
//   return RoleModel.find({ code: { $in: codes }, status: true })
//     .lean()
//     .exec();
// }

async function findByCodes(codes: string[]): Promise<Role[]> {
  return prisma.role.findMany({ where: { code: { in: codes }, status: true } });
}

async function findAll(): Promise<Role[]> {
  return prisma.role.findMany({ where: { status: true } });
}

export default {
  findByCode,
  findByCodes,
  findAll,
};
