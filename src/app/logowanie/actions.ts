'use server';

import { redirect } from 'next/navigation';
import { isValidLogin, loginToEmail } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type LoginState = { error?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const login = String(formData.get('login') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!login || !password) return { error: 'Podaj login i hasło.' };
  if (!isValidLogin(login)) return { error: 'Nieprawidłowy login lub hasło.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: loginToEmail(login), password });

  if (error) {
    if (error.status === 429) return { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut.' };
    return { error: 'Nieprawidłowy login lub hasło.' };
  }

  redirect('/');
}
