// import Keystore, { KeystoreModel } from '../model/Keystore';
// import { Types } from 'mongoose';
// import User from '../model/User';
import prisma from '../prismaClient';
import { Keystore, User } from '@prisma/client';

// async function findforKey(client: User, key: string): Promise<Keystore | null> {
//   return KeystoreModel.findOne({
//     client: client,
//     primaryKey: key,
//     status: true,
//   })
//     .lean()
//     .exec();
// }
// async function findforKey(client: User, key: string): Promise<Keystore | null> {
//   return KeystoreModel.findOne({
//     client: client,
//     primaryKey: key,
//     status: true,
//   })
//     .lean()
//     .exec();
// }
async function findforKey(client: User, key: string): Promise<Keystore | null> {
  return await prisma.keystore.findFirst({
    where: { clientId: client.id, primaryKey: key, status: true },
  });
}

// async function remove(id: Types.ObjectId): Promise<Keystore | null> {
//   return KeystoreModel.findByIdAndDelete(id).lean().exec();
// }

async function remove(id: string) {
  return await prisma.keystore.delete({ where: { id } });
}

// async function removeAllForClient(client: User) {
//   return KeystoreModel.deleteMany({ client: client }).exec();
// }

async function removeAllForClient(client: User) {
  return await prisma.keystore.deleteMany({ where: { clientId: client.id } });
}

// async function find(
//   client: User,
//   primaryKey: string,
//   secondaryKey: string,
// ): Promise<Keystore | null> {
//   return KeystoreModel.findOne({
//     client: client,
//     primaryKey: primaryKey,
//     secondaryKey: secondaryKey,
//   })
//     .lean()
//     .exec();
// }

async function find(client: User, primaryKey: string, secondaryKey: string) {
  return prisma.keystore.findFirst({
    where: {
      clientId: client.id,
      primaryKey: primaryKey,
      secondaryKey: secondaryKey,
    },
  });
  // return KeystoreModel.findOne({
  //   client: client,
  //   primaryKey: primaryKey,
  //   secondaryKey: secondaryKey,
  // })
  //   .lean()
  //   .exec();
}

// async function create(
//   client: User,
//   primaryKey: string,
//   secondaryKey: string,
// ): Promise<Keystore> {
//   const now = new Date();
//   const keystore = await KeystoreModel.create({
//     client: client,
//     primaryKey: primaryKey,
//     secondaryKey: secondaryKey,
//     createdAt: now,
//     updatedAt: now,
//   });
//   return keystore.toObject();
// }

async function create(client: User, primaryKey: string, secondaryKey: string) {
  const createdKeystore = await prisma.keystore.create({
    data: {
      clientId: client.id,
      primaryKey: primaryKey,
      secondaryKey: secondaryKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('🚀 ~ create ~ createdKeystore:', createdKeystore);
  return createdKeystore;
}

export default {
  findforKey,
  remove,
  removeAllForClient,
  find,
  create,
};
