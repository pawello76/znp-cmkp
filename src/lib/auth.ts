import { randomInt } from 'node:crypto';

/** Domena techniczna loginów. `.invalid` gwarantuje, że nigdy nie zostanie wysłana poczta. */
export const LOGIN_DOMAIN = 'login.znp-cmkp.invalid';

export const PASSWORD_MIN_LENGTH = 10;

/** Login = same cyfry; ujednolica zapis z prefiksem kraju (+48 / 0048) i odstępami. */
export function normalizeLogin(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('48')) digits = digits.slice(2);
  else if (digits.length === 13 && digits.startsWith('0048')) digits = digits.slice(4);
  return digits;
}

export function isValidLogin(raw: string): boolean {
  return /^[0-9]{4,15}$/.test(normalizeLogin(raw));
}

/** Login → techniczny adres w Supabase Auth (członek go nie widzi). */
export function loginToEmail(raw: string): string {
  return `l-${normalizeLogin(raw)}@${LOGIN_DOMAIN}`;
}

export function normalizeMemberNo(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidMemberNo(raw: string): boolean {
  return /^[0-9A-Za-z/-]{1,20}$/.test(raw.trim());
}

/** Hasło tymczasowe: 12 znaków bez mylących liter (0/O, 1/l/I). */
export function generateTempPassword(length = 12): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}
