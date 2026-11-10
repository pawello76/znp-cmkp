'use server';

import { revalidatePath } from 'next/cache';
import { generateTempPassword, isValidLogin, isValidMemberNo, loginToEmail, normalizeLogin, normalizeMemberNo } from '@/lib/auth';
import { requireBoard } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase/admin';

export type AccountResult = { error?: string; created?: { name: string; login: string; tempPassword: string } };

type NewMember = {
  login: string;
  memberNo: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  unit: string | null;
  position: string | null;
  joinedAt: string | null;
  isBoard: boolean;
};

const text = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').trim();
  return s.length ? s : null;
};

function refreshMembers() {
  revalidatePath('/zarzad');
  revalidatePath('/zarzad/czlonkowie');
}

/** Tworzy konto w Auth (klucz tajny) i wiersz członka (jako zarząd – trafia do dziennika). */
async function createAccount(input: NewMember): Promise<{ id?: string; tempPassword?: string; error?: string }> {
  const { supabase, member: actor } = await requireBoard();

  if (!isValidLogin(input.login)) return { error: 'Login musi składać się z 4–15 cyfr.' };
  const login = normalizeLogin(input.login);
  if (input.memberNo && !isValidMemberNo(input.memberNo))
    return { error: 'Numer członkowski może zawierać litery, cyfry, „-” i „/” (do 20 znaków).' };
  const memberNo = input.memberNo ? normalizeMemberNo(input.memberNo) : null;

  const { data: loginTaken } = await supabase.from('members').select('id').eq('login', login).maybeSingle();
  if (loginTaken) return { error: `Login ${login} jest już używany przez innego członka.` };
  if (memberNo) {
    const { data: noTaken } = await supabase.from('members').select('id').eq('member_no', memberNo).maybeSingle();
    if (noTaken) return { error: `Numer członkowski ${memberNo} jest już przypisany innemu członkowi.` };
  }

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: loginToEmail(login),
    password: tempPassword,
    email_confirm: true,
    app_metadata: { created_by: actor.id },
  });
  if (authError || !created.user) {
    if (authError?.code === 'email_exists') return { error: `Login ${login} jest już używany.` };
    return { error: 'Nie udało się utworzyć konta. Spróbuj ponownie.' };
  }

  const { error: insertError } = await supabase.from('members').insert({
    id: created.user.id,
    login,
    member_no: memberNo,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    unit: input.unit,
    position: input.position,
    is_board: input.isBoard,
    ...(input.joinedAt ? { joined_at: input.joinedAt } : {}),
  });
  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: 'Nie udało się zapisać danych członka. Konto nie zostało utworzone.' };
  }

  return { id: created.user.id, tempPassword };
}

export async function addMember(_prev: AccountResult, formData: FormData): Promise<AccountResult> {
  const firstName = text(formData.get('first_name'));
  const lastName = text(formData.get('last_name'));
  const login = text(formData.get('login'));
  if (!firstName || !lastName || !login) return { error: 'Wpisz login, imię i nazwisko.' };

  const result = await createAccount({
    login,
    memberNo: text(formData.get('member_no')),
    firstName,
    lastName,
    email: text(formData.get('email')),
    unit: text(formData.get('unit')),
    position: text(formData.get('position')),
    joinedAt: text(formData.get('joined_at')),
    isBoard: formData.get('is_board') === 'on',
  });
  if (result.error || !result.tempPassword) return { error: result.error };

  refreshMembers();
  return { created: { name: `${firstName} ${lastName}`, login: normalizeLogin(login), tempPassword: result.tempPassword } };
}

export async function approveDeclaration(_prev: AccountResult, formData: FormData): Promise<AccountResult> {
  const { supabase, member: actor } = await requireBoard();
  const declarationId = String(formData.get('declaration_id') ?? '');
  const login = text(formData.get('login'));
  if (!login) return { error: 'Wpisz login.' };

  const { data: d } = await supabase.from('declarations').select('*').eq('id', declarationId).maybeSingle();
  if (!d || d.status !== 'oczekuje') return { error: 'Ta deklaracja została już rozpatrzona.' };

  const result = await createAccount({
    login,
    memberNo: text(formData.get('member_no')),
    firstName: d.first_name,
    lastName: d.last_name,
    email: d.email,
    unit: d.unit,
    position: d.position,
    joinedAt: null,
    isBoard: false,
  });
  if (result.error || !result.id || !result.tempPassword) return { error: result.error };

  await supabase
    .from('declarations')
    .update({ status: 'zatwierdzona', member_id: result.id, decided_by: actor.id, decided_at: new Date().toISOString() })
    .eq('id', declarationId);

  refreshMembers();
  return { created: { name: `${d.first_name} ${d.last_name}`, login: normalizeLogin(login), tempPassword: result.tempPassword } };
}

export async function rejectDeclaration(formData: FormData) {
  const { supabase, member: actor } = await requireBoard();
  const declarationId = String(formData.get('declaration_id') ?? '');
  await supabase
    .from('declarations')
    .update({ status: 'odrzucona', decided_by: actor.id, decided_at: new Date().toISOString() })
    .eq('id', declarationId)
    .eq('status', 'oczekuje');
  refreshMembers();
}

export type ResetResult = { error?: string; tempPassword?: string };

export async function resetPassword(_prev: ResetResult, formData: FormData): Promise<ResetResult> {
  const { supabase } = await requireBoard();
  const memberId = String(formData.get('member_id') ?? '');

  const tempPassword = generateTempPassword();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(memberId, { password: tempPassword });
  if (error) return { error: 'Nie udało się zresetować hasła.' };

  await supabase.from('members').update({ must_change_password: true }).eq('id', memberId);
  return { tempPassword };
}

export async function toggleBlock(formData: FormData) {
  const { supabase, member: actor } = await requireBoard();
  const memberId = String(formData.get('member_id') ?? '');
  if (memberId === actor.id) return; // nie można zablokować samego siebie

  const { data: target } = await supabase.from('members').select('status').eq('id', memberId).maybeSingle();
  if (!target) return;
  const block = target.status === 'aktywny';

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(memberId, { ban_duration: block ? '876000h' : 'none' });
  if (error) return;

  await supabase.from('members').update({ status: block ? 'zablokowany' : 'aktywny' }).eq('id', memberId);
  refreshMembers();
}

/** Usuwa zarejestrowane aplikacje 2FA członka zarządu (np. po zgubieniu telefonu). */
export async function resetTwoFactor(formData: FormData) {
  const { supabase, member: actor } = await requireBoard();
  const memberId = String(formData.get('member_id') ?? '');
  if (memberId === actor.id) return; // własną weryfikację resetuje inny członek zarządu

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.mfa.listFactors({ userId: memberId });
  for (const factor of data?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: memberId });
  }
  await supabase.rpc('log_event', { p_action: 'reset_2fa', p_details: { member_id: memberId } });
  refreshMembers();
}
