import { Tokens } from 'app-request';
import { AuthFailureError, InternalError } from '../core/ApiError';
import JWT, { JwtPayload } from '../core/JWT';
// import { Types } from 'mongoose';
// import User from '../database/model/User';
import { tokenInfo } from '../config';
import { User } from '@prisma/client';

export const getAccessToken = (authorization?: string) => {
  if (!authorization) throw new AuthFailureError('Invalid Authorization');
  if (!authorization.startsWith('Bearer '))
    throw new AuthFailureError('Invalid Authorization');
  return authorization.split(' ')[1];
};

export const validateTokenData = (payload: JwtPayload): boolean => {
  if (
    !payload ||
    !payload.iss ||
    !payload.sub ||
    !payload.aud ||
    !payload.prm ||
    payload.iss !== tokenInfo.issuer ||
    payload.aud !== tokenInfo.audience
    // || !Types.ObjectId.isValid(payload.sub)
  ) {
    console.log('🚀 ~ validateTokenData ~ payload is not valid:', payload);
    throw new AuthFailureError('Invalid Access Token = hihi');
  }
  return true;
};

export const createTokens = async (
  user: User,
  accessTokenKey: string,
  refreshTokenKey: string,
): Promise<Tokens> => {
  const accessToken = await JWT.encode(
    new JwtPayload(
      tokenInfo.issuer,
      tokenInfo.audience,
      // user._id.toString(),
      user.id,
      accessTokenKey,
      tokenInfo.accessTokenValidity,
    ),
  );

  if (!accessToken) throw new InternalError();

  const refreshToken = await JWT.encode(
    new JwtPayload(
      tokenInfo.issuer,
      tokenInfo.audience,
      // user._id.toString(),
      user.id,
      refreshTokenKey,
      tokenInfo.refreshTokenValidity,
    ),
  );

  if (!refreshToken) throw new InternalError();

  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
  } as Tokens;
};
