'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireMember } from '@/lib/session';

export type MessageState = { error?: string };

export async function startThread(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const { supabase, member } = await requireMember();
  const subject = String(formData.get('subject') ?? '').trim().slice(0, 200);
  const body = String(formData.get('body') ?? '').trim();
  const roleId = String(formData.get('to_board_role_id') ?? '') || null;
  if (!subject || !body) return { error: 'Wpisz temat i treść wiadomości.' };
  if (body.length > 5000) return { error: 'Wiadomość jest za długa (maks. 5000 znaków).' };

  const { data: thread, error } = await supabase
    .from('message_threads')
    .insert({ member_id: member.id, subject, to_board_role_id: roleId })
    .select('id')
    .single();
  if (error || !thread) return { error: 'Nie udało się wysłać wiadomości.' };

  const { error: msgErr } = await supabase.from('messages').insert({ thread_id: thread.id, author_id: member.id, body });
  if (msgErr) return { error: 'Nie udało się wysłać wiadomości.' };

  revalidatePath('/kontakt');
  redirect(`/kontakt/${thread.id}`);
}

export async function replyInThread(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const { supabase, member } = await requireMember();
  const threadId = String(formData.get('thread_id') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  if (!body) return { error: 'Wpisz treść wiadomości.' };
  if (body.length > 5000) return { error: 'Wiadomość jest za długa (maks. 5000 znaków).' };

  const { error } = await supabase.from('messages').insert({ thread_id: threadId, author_id: member.id, body });
  if (error) return { error: 'Nie udało się wysłać wiadomości.' };

  revalidatePath(`/kontakt/${threadId}`);
  revalidatePath(`/zarzad/wiadomosci/${threadId}`);
  revalidatePath('/kontakt');
  return {};
}
