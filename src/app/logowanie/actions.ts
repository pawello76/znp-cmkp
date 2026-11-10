'use server';

import { redirect } from 'next/navigation';
import { isValidMemberNo, memberNoToEmail } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type LoginState = { error?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const memberNo = String(formData.get('member_no') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!memberNo || !password) return { error: 'Podaj numer członkowski i hasło.' };
  if (!isValidMemberNo(memberNo)) return { error: 'Nieprawidłowy numer członkowski lub hasło.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: memberNoToEmail(memberNo), password });

  if (error) {
    if (error.status === 429) return { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut.' };
    return { error: 'Nieprawidłowy numer członkowski lub hasło.' };
  }

  redirect('/');
}
