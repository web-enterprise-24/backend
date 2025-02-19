import { User } from '@prisma/client';
import _ from 'lodash';

export const enum AccessMode {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
}

// export async function getUserData(user: User) {
//   const data = _.pick(user, ['_id', 'name', 'roles', 'profilePicUrl']);
//   return data;
// }

export async function getUserData(user: User) {
  const data = _.pick(user, [
    'id',
    'name',
    'roles',
    'profilePicUrl',
    'dateOfBirth',
    'gender',
    'address',
    'city',
    'country',
  ]);
  return data;
}
