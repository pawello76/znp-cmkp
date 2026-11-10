'use server';

import { revalidatePath } from 'next/cache';
import { requireBoard } from '@/lib/session';

export type NewsFormState = { error?: string; ok?: string };

const text = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').trim();
  return s.length ? s : null;
};

function refresh() {
  revalidatePath('/zarzad/aktualnosci');
  revalidatePath('/aktualnosci');
  revalidatePath('/');
}

export async function addNews(_prev: NewsFormState, formData: FormData): Promise<NewsFormState> {
  const { supabase, member } = await requireBoard();
  const title = text(formData.get('title'));
  if (!title) return { error: 'Wpisz tytuł.' };
  const publish = formData.get('publish') === 'on';

  const { error } = await supabase.from('news').insert({
    title,
    lead: text(formData.get('lead')),
    body: text(formData.get('body')),
    author_id: member.id,
    is_published: publish,
    published_at: new Date().toISOString(),
  });
  if (error) return { error: 'Nie udało się zapisać aktualności.' };
  refresh();
  return { ok: publish ? 'Aktualność opublikowana.' : 'Zapisano szkic.' };
}

export async function togglePublishNews(formData: FormData) {
  const { supabase } = await requireBoard();
  const id = String(formData.get('news_id') ?? '');
  const publish = formData.get('publish') === '1';
  await supabase
    .from('news')
    .update(publish ? { is_published: true, published_at: new Date().toISOString() } : { is_published: false })
    .eq('id', id);
  refresh();
}

export async function deleteNews(formData: FormData) {
  const { supabase } = await requireBoard();
  await supabase.from('news').delete().eq('id', String(formData.get('news_id') ?? ''));
  refresh();
}
