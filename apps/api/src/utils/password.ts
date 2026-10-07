import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Compared against when the email does not exist, so a login attempt takes the same time
// whether or not the account exists (prevents user enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', env.BCRYPT_ROUNDS);

export async function verifyPasswordOrDummy(plain: string, hash: string | undefined) {
  const ok = await bcrypt.compare(plain, hash ?? DUMMY_HASH);
  return hash !== undefined && ok;
}
