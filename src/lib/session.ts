import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import type { Database } from './supabase/types';

export type Member = Database['public']['Tables']['members']['Row'];

/**
 * Wymaga zalogowanego, aktywnego członka. Konto z hasłem tymczasowym
 * trafia najpierw na ekran zmiany hasła.
 */
export async function requireMember(options: { allowTempPassword?: boolean } = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/logowanie');

  const { data: member } = await supabase.from('members').select('*').eq('id', user.id).maybeSingle();

  if (!member || member.status !== 'aktywny') {
    await supabase.auth.signOut();
    redirect('/logowanie?blad=konto');
  }

  if (member.must_change_password && !options.allowTempPassword) redirect('/zmiana-hasla');

  return { supabase, user, member };
}

/** Wymaga członka zarządu, który potwierdził logowanie kodem 2FA w tej sesji. */
export async function requireBoard() {
  const ctx = await requireMember();
  if (!ctx.member.is_board) redirect('/');

  const { data: aal } = await ctx.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') redirect('/weryfikacja');

  return ctx;
}

/** Ważność legitymacji: data ustawiona przez zarząd, a domyślnie koniec bieżącego roku. */
export function cardValidUntil(member: Member): string {
  return member.card_valid_until ?? `${new Date().getFullYear()}-12-31`;
}
