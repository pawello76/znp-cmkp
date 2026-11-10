'use server';

import { revalidatePath } from 'next/cache';
import { requireBoard } from '@/lib/session';

export type FormState = { error?: string; ok?: string };

const text = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').trim();
  return s.length ? s : null;
};
const isDate = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isMonth = (s: string | null) => !!s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

export async function updateMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, member: actor } = await requireBoard();
  const id = String(formData.get('member_id') ?? '');
  const firstName = text(formData.get('first_name'));
  const lastName = text(formData.get('last_name'));
  const joinedAt = text(formData.get('joined_at'));
  const cardValidUntil = text(formData.get('card_valid_until'));
  const isBoard = formData.get('is_board') === 'on';

  if (!firstName || !lastName) return { error: 'Imię i nazwisko są wymagane.' };
  if (!isDate(joinedAt)) return { error: 'Podaj datę przyjęcia.' };
  if (cardValidUntil && !isDate(cardValidUntil)) return { error: 'Nieprawidłowa data ważności legitymacji.' };
  if (id === actor.id && !isBoard) return { error: 'Nie możesz odebrać sobie uprawnień zarządu. Poproś innego członka zarządu.' };

  const { error } = await supabase
    .from('members')
    .update({
      first_name: firstName,
      last_name: lastName,
      email: text(formData.get('email')),
      unit: text(formData.get('unit')),
      position: text(formData.get('position')),
      joined_at: joinedAt!,
      card_valid_until: cardValidUntil,
      is_board: isBoard,
    })
    .eq('id', id);
  if (error) return { error: 'Nie udało się zapisać zmian.' };

  revalidatePath(`/zarzad/czlonek/${id}`);
  revalidatePath('/zarzad');
  return { ok: 'Zapisano zmiany.' };
}

export async function addPayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireBoard();
  const memberId = String(formData.get('member_id') ?? '');
  const paidOn = text(formData.get('paid_on'));
  const from = text(formData.get('period_from'));
  const to = text(formData.get('period_to')) ?? from;
  const amountRaw = (text(formData.get('amount')) ?? '').replace(/\s/g, '').replace(',', '.');
  const amount = Math.round(Number(amountRaw) * 100);

  if (!isDate(paidOn)) return { error: 'Podaj datę wpłaty.' };
  if (!isMonth(from) || !isMonth(to)) return { error: 'Podaj okres (miesiąc od – do).' };
  if (to! < from!) return { error: 'Miesiąc „do” nie może być wcześniejszy niż „od”.' };
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Podaj kwotę większą od zera, np. 35,00.' };

  const { error } = await supabase.from('dues_payments').insert({
    member_id: memberId,
    paid_on: paidOn!,
    period_from: `${from}-01`,
    period_to: `${to}-01`,
    amount_grosz: amount,
    source: 'reczny',
    note: text(formData.get('note')),
  });
  if (error) return { error: 'Nie udało się zapisać wpłaty.' };

  revalidatePath(`/zarzad/czlonek/${memberId}`);
  revalidatePath('/zarzad');
  return { ok: 'Wpłata zapisana.' };
}

export async function deletePayment(formData: FormData) {
  const { supabase } = await requireBoard();
  const id = String(formData.get('payment_id') ?? '');
  const memberId = String(formData.get('member_id') ?? '');
  await supabase.from('dues_payments').delete().eq('id', id);
  revalidatePath(`/zarzad/czlonek/${memberId}`);
  revalidatePath('/zarzad');
}
