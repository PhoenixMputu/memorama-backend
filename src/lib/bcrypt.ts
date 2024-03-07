import * as bcrypt from 'bcrypt';

export const encrypt = async (password: string) =>
  await bcrypt.hash(password, 10);

export const compare = async (password: string, hashedPassword: string) =>
  await bcrypt.compare(password, hashedPassword);
