'use server';

import { revalidatePath } from 'next/cache';
import { warsawLocalToISO } from '@/lib/format';
import { requireBoard } from '@/lib/session';

export type EventFormState = { error?: string; ok?: string };

const text = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').trim();
  return s.length ? s : null;
};

function refresh() {
  revalidatePath('/zarzad/wydarzenia');
  revalidatePath('/wydarzenia');
  revalidatePath('/');
}

export async function addEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const { supabase } = await requireBoard();
  const title = text(formData.get('title'));
  const startsAt = warsawLocalToISO(String(formData.get('starts_at') ?? ''));
  const endsRaw = text(formData.get('ends_at'));
  const endsAt = endsRaw ? warsawLocalToISO(endsRaw) : null;
  const capacityRaw = text(formData.get('capacity'));
  const capacity = capacityRaw ? Number(capacityRaw) : null;

  if (!title) return { error: 'Wpisz nazwę wydarzenia.' };
  if (!startsAt) return { error: 'Podaj datę i godzinę rozpoczęcia.' };
  if (endsRaw && (!endsAt || endsAt <= startsAt)) return { error: 'Koniec musi być później niż początek.' };
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) return { error: 'Limit miejsc musi być liczbą większą od zera.' };

  const { error } = await supabase.from('events').insert({
    title,
    description: text(formData.get('description')),
    place: text(formData.get('place')),
    starts_at: startsAt,
    ends_at: endsAt,
    capacity,
    registration_open: true,
    is_published: true,
  });
  if (error) return { error: 'Nie udało się zapisać wydarzenia.' };
  refresh();
  return { ok: 'Wydarzenie dodane i widoczne dla członków.' };
}

export async function toggleRegistrationOpen(formData: FormData) {
  const { supabase } = await requireBoard();
  await supabase
    .from('events')
    .update({ registration_open: formData.get('open') === '1' })
    .eq('id', String(formData.get('event_id') ?? ''));
  refresh();
}

export async function deleteEvent(formData: FormData) {
  const { supabase } = await requireBoard();
  await supabase.from('events').delete().eq('id', String(formData.get('event_id') ?? ''));
  refresh();
}
