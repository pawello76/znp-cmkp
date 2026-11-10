'use server';

import { revalidatePath } from 'next/cache';
import { requireBoard } from '@/lib/session';
import type { MessageState } from '@/app/kontakt/actions';

export async function boardReply(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const { supabase, member } = await requireBoard();
  const threadId = String(formData.get('thread_id') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  if (!body) return { error: 'Wpisz treść odpowiedzi.' };
  if (body.length > 5000) return { error: 'Odpowiedź jest za długa (maks. 5000 znaków).' };

  const { error } = await supabase.from('messages').insert({ thread_id: threadId, author_id: member.id, body });
  if (error) return { error: 'Nie udało się wysłać odpowiedzi.' };
  // Odpowiedziany wątek trafia do „Przeczytane”
  await supabase.from('message_threads').update({ board_folder: 'przeczytane' }).eq('id', threadId).eq('board_folder', 'aktualne');

  revalidatePath(`/zarzad/wiadomosci/${threadId}`);
  revalidatePath('/zarzad/wiadomosci');
  return {};
}

export async function setFolder(formData: FormData) {
  const { supabase } = await requireBoard();
  const threadId = String(formData.get('thread_id') ?? '');
  const folder = String(formData.get('folder') ?? '');
  if (!['aktualne', 'przeczytane', 'archiwalne'].includes(folder)) return;
  await supabase
    .from('message_threads')
    .update({ board_folder: folder as 'aktualne' | 'przeczytane' | 'archiwalne' })
    .eq('id', threadId);
  revalidatePath(`/zarzad/wiadomosci/${threadId}`);
  revalidatePath('/zarzad/wiadomosci');
}
