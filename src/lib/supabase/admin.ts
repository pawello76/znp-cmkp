import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Klient z kluczem tajnym – omija RLS. Używać WYŁĄCZNIE w akcjach serwera,
 * po sprawdzeniu, że wywołuje go zalogowany członek zarządu (requireBoard).
 * Służy tylko do operacji na kontach w Supabase Auth.
 */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('Brak SUPABASE_SECRET_KEY w zmiennych środowiskowych serwera.');

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
