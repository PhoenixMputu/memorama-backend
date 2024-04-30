import * as speakeasy from 'speakeasy';
import 'dotenv/config';

export const verify = (code: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables.');
  }

  return speakeasy.totp.verify({
    secret: process.env.JWT_SECRET!,
    digits: 5,
    step: 60 * 15,
    encoding: 'base32',
    token: code,
  });
};

export const generateCode = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables.');
  }
  
  return speakeasy.totp({
    secret: process.env.JWT_SECRET!,
    digits: 5,
    step: 60 * 15,
    encoding: 'base32',
  });
};
