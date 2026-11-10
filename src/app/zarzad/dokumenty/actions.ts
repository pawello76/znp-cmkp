'use server';

import { revalidatePath } from 'next/cache';
import { requireBoard } from '@/lib/session';

function refresh() {
  revalidatePath('/zarzad/dokumenty');
  revalidatePath('/dokumenty');
  revalidatePath('/');
}

/** Wywoływane po wgraniu pliku z przeglądarki do prywatnego miejsca „documents”. */
export async function createDocument(formData: FormData): Promise<{ error?: string }> {
  const { supabase } = await requireBoard();
  const title = String(formData.get('title') ?? '').trim();
  const filePath = String(formData.get('file_path') ?? '');
  const categoryId = String(formData.get('category_id') ?? '') || null;
  if (!title || !/^[0-9a-f-]{36}\.pdf$/.test(filePath)) return { error: 'Brak tytułu lub pliku.' };

  const { error } = await supabase.from('documents').insert({
    title,
    category_id: categoryId,
    file_path: filePath,
    requires_ack: formData.get('requires_ack') === 'on',
    is_published: formData.get('publish') === 'on',
    published_at: new Date().toISOString(),
  });
  if (error) {
    await supabase.storage.from('documents').remove([filePath]);
    return { error: 'Nie udało się zapisać dokumentu.' };
  }
  refresh();
  return {};
}

export async function togglePublishDocument(formData: FormData) {
  const { supabase } = await requireBoard();
  const id = String(formData.get('document_id') ?? '');
  const publish = formData.get('publish') === '1';
  await supabase
    .from('documents')
    .update(publish ? { is_published: true, published_at: new Date().toISOString() } : { is_published: false })
    .eq('id', id);
  refresh();
}

export async function deleteDocument(formData: FormData) {
  const { supabase } = await requireBoard();
  const id = String(formData.get('document_id') ?? '');
  const { data: doc } = await supabase.from('documents').select('file_path').eq('id', id).maybeSingle();
  if (!doc) return;
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (!error) await supabase.storage.from('documents').remove([doc.file_path]);
  refresh();
}
