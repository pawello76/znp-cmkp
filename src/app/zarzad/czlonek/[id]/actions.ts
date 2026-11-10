'use server';

import { revalidatePath } from 'next/cache';
import { isValidLogin, isValidMemberNo, loginToEmail, normalizeLogin, normalizeMemberNo } from '@/lib/auth';
import { requireBoard } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase/admin';

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

  const loginRaw = text(formData.get('login'));
  if (!loginRaw || !isValidLogin(loginRaw)) return { error: 'Login musi składać się z 4–15 cyfr.' };
  const login = normalizeLogin(loginRaw);
  const noRaw = text(formData.get('member_no'));
  if (noRaw && !isValidMemberNo(noRaw)) return { error: 'Numer członkowski może zawierać litery, cyfry, „-” i „/” (do 20 znaków).' };
  const memberNo = noRaw ? normalizeMemberNo(noRaw) : null;

  const { data: current } = await supabase.from('members').select('login, member_no').eq('id', id).maybeSingle();
  if (!current) return { error: 'Nie znaleziono członka.' };
  if (memberNo && memberNo !== current.member_no) {
    const { data: taken } = await supabase.from('members').select('id').eq('member_no', memberNo).neq('id', id).maybeSingle();
    if (taken) return { error: `Numer członkowski ${memberNo} jest już przypisany innemu członkowi.` };
  }
  if (login !== current.login) {
    const { data: taken } = await supabase.from('members').select('id').eq('login', login).neq('id', id).maybeSingle();
    if (taken) return { error: `Login ${login} jest już używany przez innego członka.` };
    const admin = createAdminClient();
    const { error: authErr } = await admin.auth.admin.updateUserById(id, { email: loginToEmail(login), email_confirm: true });
    if (authErr) return { error: 'Nie udało się zmienić loginu.' };
  }

  const { error } = await supabase
    .from('members')
    .update({
      first_name: firstName,
      last_name: lastName,
      login,
      member_no: memberNo,
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
  revalidatePath('/zarzad/czlonkowie');
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
  revalidatePath('/zarzad/czlonkowie');
  return { ok: 'Wpłata zapisana.' };
}

export async function deletePayment(formData: FormData) {
  const { supabase } = await requireBoard();
  const id = String(formData.get('payment_id') ?? '');
  const memberId = String(formData.get('member_id') ?? '');
  await supabase.from('dues_payments').delete().eq('id', id);
  revalidatePath(`/zarzad/czlonek/${memberId}`);
  revalidatePath('/zarzad/czlonkowie');
}
