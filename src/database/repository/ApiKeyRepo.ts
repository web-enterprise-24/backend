// import ApiKey, { ApiKeyModel } from '../model/ApiKey';
import { ApiKey } from '@prisma/client';
import prisma from '../prismaClient';

// async function findByKey(key: string): Promise<ApiKey | null> {
//   return ApiKeyModel.findOne({ key: key, status: true }).lean().exec();
// }

async function findByKey(key: string): Promise<ApiKey | null> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: key, status: true },
  });
  return apiKey;
}

export default {
  findByKey,
};
