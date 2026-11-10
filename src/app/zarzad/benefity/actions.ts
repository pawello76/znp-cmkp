'use server';

import { revalidatePath } from 'next/cache';
import { requireBoard } from '@/lib/session';

export type BenefitFormState = { error?: string; ok?: string };

function refresh() {
  revalidatePath('/zarzad/benefity');
  revalidatePath('/benefity');
}

export async function decideRequest(formData: FormData) {
  const { supabase, member } = await requireBoard();
  const decision = String(formData.get('decision') ?? '');
  if (!['przyznany', 'odrzucony', 'zakonczony'].includes(decision)) return;
  const status = decision as 'przyznany' | 'odrzucony' | 'zakonczony';
  await supabase
    .from('benefit_requests')
    .update({
      status,
      decided_by: member.id,
      decided_at: new Date().toISOString(),
      ...(status === 'przyznany' ? { active_from: new Date().toISOString().slice(0, 10) } : {}),
    })
    .eq('id', String(formData.get('request_id') ?? ''));
  refresh();
}

export async function toggleBenefitVisible(formData: FormData) {
  const { supabase } = await requireBoard();
  await supabase
    .from('benefits')
    .update({ is_visible: formData.get('visible') === '1' })
    .eq('id', String(formData.get('benefit_id') ?? ''));
  refresh();
}

export async function addBenefit(_prev: BenefitFormState, formData: FormData): Promise<BenefitFormState> {
  const { supabase } = await requireBoard();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Wpisz nazwę benefitu.' };
  const { count } = await supabase.from('benefits').select('id', { count: 'exact', head: true });
  const { error } = await supabase.from('benefits').insert({
    name: name.slice(0, 200),
    category: String(formData.get('category') ?? '').trim() || null,
    description: String(formData.get('description') ?? '').trim() || null,
    sort_order: (count ?? 0) + 1,
  });
  if (error) return { error: 'Nie udało się dodać benefitu.' };
  refresh();
  return { ok: 'Benefit dodany i widoczny dla członków.' };
}

export async function updateBenefit(_prev: BenefitFormState, formData: FormData): Promise<BenefitFormState> {
  const { supabase } = await requireBoard();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Nazwa nie może być pusta.' };
  const { error } = await supabase
    .from('benefits')
    .update({
      name: name.slice(0, 200),
      category: String(formData.get('category') ?? '').trim() || null,
      description: String(formData.get('description') ?? '').trim() || null,
    })
    .eq('id', String(formData.get('benefit_id') ?? ''));
  if (error) return { error: 'Nie udało się zapisać zmian.' };
  refresh();
  return { ok: 'Zapisano.' };
}
