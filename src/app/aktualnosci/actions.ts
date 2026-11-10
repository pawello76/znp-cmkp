'use server';

import { revalidatePath } from 'next/cache';
import { requireMember } from '@/lib/session';

export async function markNewsRead(formData: FormData) {
  const { supabase, member } = await requireMember();
  const newsId = String(formData.get('news_id') ?? '');
  await supabase.from('news_reads').upsert({ news_id: newsId, member_id: member.id }, { ignoreDuplicates: true });
  revalidatePath('/aktualnosci');
  revalidatePath('/');
}

export async function markAllNewsRead() {
  const { supabase, member } = await requireMember();
  const { data: news } = await supabase.from('news').select('id').eq('is_published', true);
  const rows = (news ?? []).map((n) => ({ news_id: n.id, member_id: member.id }));
  if (rows.length) await supabase.from('news_reads').upsert(rows, { ignoreDuplicates: true });
  revalidatePath('/aktualnosci');
  revalidatePath('/');
}
