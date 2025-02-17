import {
  // User,
  UserModel,
} from '../model/User';
// import { RoleModel } from '../model/Role';
import { InternalError } from '../../core/ApiError';
import { Types } from 'mongoose';
import KeystoreRepo from './KeystoreRepo';
// import Keystore from '../model/Keystore';
import prisma from '../prismaClient';
import { User } from '@prisma/client';

async function exists(id: Types.ObjectId): Promise<boolean> {
  const user = await UserModel.exists({ _id: id, status: true });
  return user !== null && user !== undefined;
}

// async function findPrivateProfileById(
//   id: Types.ObjectId,
// ): Promise<User | null> {
//   return UserModel.findOne({ _id: id, status: true })
//     .select('+email')
//     .populate({
//       path: 'roles',
//       match: { status: true },
//       select: { code: 1 },
//     })
//     .lean<User>()
//     .exec();
// }
async function findPrivateProfileById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { roles: true },
  });
}

// contains critical information of the user
// async function findById(id: Types.ObjectId): Promise<User | null> {
//   return UserModel.findOne({ _id: id, status: true })
//     .select('+email +password +roles')
//     .populate({
//       path: 'roles',
//       match: { status: true },
//     })
//     .lean()
//     .exec();
// }
async function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

// async function findByEmail(email: string): Promise<User | null> {
//   return UserModel.findOne({ email: email })
//     .select(
//       '+email +password +roles +gender +dob +grade +country +state +city +school +bio +hobbies',
//     )
//     .populate({
//       path: 'roles',
//       match: { status: true },
//       select: { code: 1 },
//     })
//     .lean()
//     .exec();
// }

// async function findByEmail(email: string): Promise<User | null> {
//   return UserModel.findOne({ email: email })
//     .select(
//       '+email +password +roles +gender +dob +grade +country +state +city +school +bio +hobbies',
//     )
//     .populate({
//       path: 'roles',
//       match: { status: true },
//       select: { code: 1 },
//     })
//     .lean()
//     .exec();
// }

async function findByEmail(email: string) {
  console.log('🚀 ~ findByEmail ~ email:', email);
  return await prisma.user.findUnique({
    where: { email },
  });
}

// async function findFieldsById(
//   id: Types.ObjectId,
//   ...fields: string[]
// ): Promise<User | null> {
//   return UserModel.findOne({ _id: id, status: true }, [...fields])
//     .lean()
//     .exec();
// }

async function findFieldsById(id: string, ...fields: string[]) {
  const selectFields = fields.reduce(
    (acc, field) => {
      acc[field] = true;
      return acc;
    },
    {} as Record<string, boolean>,
  );
  return prisma.user.findUnique({
    where: { id },
    select: selectFields,
  });
}

// async function findPublicProfileById(id: Types.ObjectId): Promise<User | null> {
//   return UserModel.findOne({ _id: id, status: true }).lean().exec();
// }

async function findPublicProfileById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

// async function create(
//   user: User,
//   accessTokenKey: string,
//   refreshTokenKey: string,
//   roleCode: string,
// ): Promise<{ user: User; keystore: Keystore }> {
//   const now = new Date();

//   const role = await RoleModel.findOne({ code: roleCode })
//     .select('+code')
//     .lean()
//     .exec();
//   if (!role) throw new InternalError('Role must be defined');

//   user.roles = [role];
//   user.createdAt = user.updatedAt = now;
//   const createdUser = await UserModel.create(user);
//   const keystore = await KeystoreRepo.create(
//     createdUser,
//     accessTokenKey,
//     refreshTokenKey,
//   );
//   return {
//     user: { ...createdUser.toObject(), roles: user.roles },
//     keystore: keystore,
//   };
// }

async function create(
  user: User,
  accessTokenKey: string,
  refreshTokenKey: string,
  roleCode: string,
) {
  const now = new Date();
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) throw new InternalError('Role must be defined');
  user.createdAt = user.updatedAt = now;
  console.log('🚀 ~ user:', user);
  const createdUser = await prisma.user.create({
    data: {
      ...user,
      roles: { connect: { id: role.id } },
    },
  });
  console.log('🚀 ~ createdUser:', createdUser);
  const keystore = await KeystoreRepo.create(
    createdUser,
    accessTokenKey,
    refreshTokenKey,
  );
  console.log('🚀 ~ keystore:', keystore);
  return { user: createdUser, keystore: keystore };
}

// async function update(
//   user: User,
//   accessTokenKey: string,
//   refreshTokenKey: string,
// ): Promise<{ user: User; keystore: Keystore }> {
//   user.updatedAt = new Date();
//   await UserModel.updateOne({ _id: user._id }, { $set: { ...user } })
//     .lean()
//     .exec();
//   const keystore = await KeystoreRepo.create(
//     user,
//     accessTokenKey,
//     refreshTokenKey,
//   );
//   return { user: user, keystore: keystore };
// }

async function update(
  user: User,
  accessTokenKey: string,
  refreshTokenKey: string,
) {
  user.updatedAt = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { ...user },
  });
  const keystore = await KeystoreRepo.create(
    user,
    accessTokenKey,
    refreshTokenKey,
  );
  return { user: user, keystore: keystore };
}

// async function updateInfo(user: User): Promise<any> {
//   user.updatedAt = new Date();
//   return UserModel.updateOne({ _id: user._id }, { $set: { ...user } })
//     .lean()
//     .exec();
// }

async function updateInfo(user: User) {
  user.updatedAt = new Date();
  return await prisma.user.update({
    where: { id: user.id },
    data: { ...user },
  });
}

export default {
  exists,
  findPrivateProfileById,
  findById,
  findByEmail,
  findFieldsById,
  findPublicProfileById,
  create,
  update,
  updateInfo,
};
