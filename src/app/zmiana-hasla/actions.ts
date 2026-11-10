'use server';

import { redirect } from 'next/navigation';
import { PASSWORD_MIN_LENGTH } from '@/lib/auth';
import { requireMember } from '@/lib/session';

export type ChangePasswordState = { error?: string };

export async function changePassword(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const { supabase } = await requireMember({ allowTempPassword: true });
  const password = String(formData.get('password') ?? '');
  const repeat = String(formData.get('repeat') ?? '');

  if (password.length < PASSWORD_MIN_LENGTH) return { error: `Hasło musi mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków.` };
  if (password !== repeat) return { error: 'Hasła nie są takie same.' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === 'same_password') return { error: 'Nowe hasło musi różnić się od obecnego.' };
    if (error.code === 'weak_password') return { error: 'Hasło jest zbyt słabe. Użyj dłuższego hasła.' };
    return { error: 'Nie udało się zmienić hasła. Spróbuj ponownie.' };
  }

  await supabase.rpc('mark_password_changed');
  redirect('/');
}
