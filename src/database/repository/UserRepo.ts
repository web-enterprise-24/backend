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
import { AllocateStatus } from '../model/Allocate';
import { RoleCode } from '../model/Role';

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
    include: {
      roles: true,
      studentAllocations: {
        select: {
          tutor: {
            select: {
              name: true,
              profilePicUrl: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
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
    include: { roles: true },
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
    include: { roles: true },
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
    include: { roles: true },
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
  console.log('🚀 ~ user:', user);
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
    include: { roles: true },
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

async function activeAccount(id: string, status: boolean) {
  return await prisma.user.update({
    where: { id },
    data: { status },
  });
}

async function findAll() {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      profilePicUrl: true,
      verified: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      address: true,
      city: true,
      country: true,
      dateOfBirth: true,
      gender: true,
      firstName: true,
      lastName: true,
      roles: true,
      // password field is omitted
    },
  });
}

// async function findByRole(roleCode: string) {
//   return await prisma.user.findMany({
//     where: {
//       roles: {
//         some: {
//           code: roleCode,
//         },
//       },
//     },
// select: {
//   id: true,
//   email: true,
//   name: true,
//   profilePicUrl: true,
//   verified: true,
//   status: true,
//   createdAt: true,
//   updatedAt: true,
//   address: true,
//   city: true,
//   country: true,
//   dateOfBirth: true,
//   gender: true,
//   firstName: true,
//   lastName: true,
//   roles: true,
//   // password field is omitted
// }
//   });
// }

async function findByRole(
  roleCode: string,
  skip?: number,
  limit?: number,
  status?: boolean,
  sortOrder: 'asc' | 'desc' = 'desc',
  search?: string,
  filter?: string,
) {
  console.log('🚀 ~ filter:', filter);
  let result = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          code: roleCode,
        },
      },
      ...(status !== undefined && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          // { firstName: { contains: search, mode: 'insensitive' } },
          // { lastName: { contains: search, mode: 'insensitive' } }
        ],
      }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      profilePicUrl: true,
      verified: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      address: true,
      city: true,
      country: true,
      dateOfBirth: true,
      gender: true,
      firstName: true,
      lastName: true,
      roles: true,
      studentAllocations: {
        select: {
          tutor: {
            select: {
              name: true,
              profilePicUrl: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      // password is omitted by not including it in select
    },
    orderBy: {
      updatedAt: sortOrder,
    },
    // skip: skip,
    skip,
    take: limit,
  });
  if (filter === AllocateStatus.ALLOCATED) {
    console.log('🚀 ~ filter:', filter);
    result = result.filter((user) => {
      return user.studentAllocations.length > 0;
    });
  } else if (filter === AllocateStatus.UNALLOCATED) {
    result = result.filter((user) => {
      return user.studentAllocations.length === 0;
    });
  }
  if (roleCode === RoleCode.TUTOR || roleCode === RoleCode.STAFF) {
    result = result.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { studentAllocations, ...rest } = user;
      return rest as any;
    });
  }
  return result;
}

async function countByRole(
  roleCode: string,
  status?: boolean,
  search?: string,
  filter?: string,
) {
  return await prisma.user.count({
    where: {
      roles: {
        some: {
          code: roleCode,
        },
      },
      ...(filter === AllocateStatus.ALLOCATED && {
        studentAllocations: {
          some: {},
        },
      }),
      ...(filter === AllocateStatus.UNALLOCATED && {
        studentAllocations: {
          none: {},
        },
      }),
      ...(status !== undefined && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          // { firstName: { contains: search, mode: 'insensitive' } },
          // { lastName: { contains: search, mode: 'insensitive' } }
        ],
      }),
    },
  });
}

async function findManyByIds(ids: string[]) {
  return await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicUrl: true,
    },
  });
}

async function findPublicUser(currentUserId: string, searchString: string) {
  return await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      ...(searchString && {
        OR: [
          { name: { contains: searchString, mode: 'insensitive' } },
          { email: { contains: searchString, mode: 'insensitive' } },
          { firstName: { contains: searchString, mode: 'insensitive' } },
          { lastName: { contains: searchString, mode: 'insensitive' } },
        ],
      }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicUrl: true,
      firstName: true,
      lastName: true,
      roles: true,
    },
    take: 10,
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
  activeAccount,
  findAll,
  findByRole,
  countByRole,
  findManyByIds,
  findPublicUser,
};
