'use server';

import { revalidatePath } from 'next/cache';
import { requireMember } from '@/lib/session';

export type RegistrationState = { error?: string };

export async function toggleRegistration(_prev: RegistrationState, formData: FormData): Promise<RegistrationState> {
  const { supabase, member } = await requireMember();
  const eventId = String(formData.get('event_id') ?? '');
  const register = formData.get('register') === '1';

  if (register) {
    const { error } = await supabase.from('event_registrations').insert({ event_id: eventId, member_id: member.id });
    if (error) {
      if (error.message.includes('Brak wolnych miejsc')) return { error: 'Brak wolnych miejsc.' };
      if (error.message.includes('zamknięte')) return { error: 'Zapisy na to wydarzenie są zamknięte.' };
      if (error.code === '23505') return {};
      return { error: 'Nie udało się zapisać. Spróbuj ponownie.' };
    }
  } else {
    await supabase.from('event_registrations').delete().eq('event_id', eventId).eq('member_id', member.id);
  }

  revalidatePath('/wydarzenia');
  revalidatePath('/');
  return {};
}
