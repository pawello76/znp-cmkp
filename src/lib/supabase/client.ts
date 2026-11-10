import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/** Klient w przeglądarce (wgrywanie zdjęcia, 2FA) – działa w imieniu zalogowanej osoby, obowiązuje RLS. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
