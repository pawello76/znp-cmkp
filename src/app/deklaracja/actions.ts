'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export type DeclarationState = { error?: string; sent?: boolean };

const text = (v: FormDataEntryValue | null, max = 200) => String(v ?? '').trim().slice(0, max);

/** Deklaracja składana bez logowania; zapis przez serwer, bo anonimowy dostęp do bazy jest zamknięty. */
export async function submitDeclaration(_prev: DeclarationState, formData: FormData): Promise<DeclarationState> {
  // Pole-pułapka dla botów: człowiek go nie widzi i nie wypełnia.
  if (text(formData.get('website'))) return { sent: true };

  const firstName = text(formData.get('first_name'), 100);
  const lastName = text(formData.get('last_name'), 100);
  const email = text(formData.get('email'), 200);
  const unit = text(formData.get('unit'));
  const position = text(formData.get('position'));
  const consentStatute = formData.get('consent_statute') === 'on';
  const consentRodo = formData.get('consent_rodo') === 'on';

  if (!firstName || !lastName || !email) return { error: 'Wpisz imię, nazwisko i adres e-mail.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Sprawdź adres e-mail.' };
  if (!consentStatute || !consentRodo) return { error: 'Zaznacz oba oświadczenia, aby złożyć deklarację.' };

  const admin = createAdminClient();

  // Prosty limit: najwyżej 3 oczekujące deklaracje na ten sam e-mail.
  const { count } = await admin
    .from('declarations')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .eq('status', 'oczekuje');
  if ((count ?? 0) >= 3) return { sent: true };

  const { error } = await admin.from('declarations').insert({
    first_name: firstName,
    last_name: lastName,
    email,
    unit: unit || null,
    position: position || null,
    consent_statute: consentStatute,
    consent_rodo: consentRodo,
  });
  if (error) return { error: 'Nie udało się wysłać deklaracji. Spróbuj ponownie później.' };

  return { sent: true };
}
