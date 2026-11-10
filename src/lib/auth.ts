import { randomInt } from 'node:crypto';

/** Domena techniczna loginów. `.invalid` gwarantuje, że nigdy nie zostanie wysłana poczta. */
export const LOGIN_DOMAIN = 'login.znp-cmkp.invalid';

export const PASSWORD_MIN_LENGTH = 10;

export function normalizeMemberNo(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidMemberNo(raw: string): boolean {
  return /^[0-9A-Za-z/-]{1,20}$/.test(raw.trim());
}

/** Numer członkowski → techniczny login w Supabase Auth (członek go nie widzi). */
export function memberNoToEmail(raw: string): string {
  const local = normalizeMemberNo(raw).toLowerCase().replace(/\//g, '_');
  return `m-${local}@${LOGIN_DOMAIN}`;
}

/** Hasło tymczasowe: 12 znaków bez mylących liter (0/O, 1/l/I). */
export function generateTempPassword(length = 12): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}
