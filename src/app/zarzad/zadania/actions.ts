'use server';

import { revalidatePath } from 'next/cache';
import { requireBoard } from '@/lib/session';

export type TaskFormState = { error?: string; ok?: string };

export async function addTask(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const { supabase, member } = await requireBoard();
  const title = String(formData.get('title') ?? '').trim();
  const assignee = String(formData.get('assignee_id') ?? '');
  const due = String(formData.get('due_on') ?? '') || null;
  if (!title) return { error: 'Wpisz, co trzeba zrobić.' };
  if (!assignee) return { error: 'Wybierz osobę.' };

  const { error } = await supabase.from('tasks').insert({
    title: title.slice(0, 300),
    description: String(formData.get('description') ?? '').trim() || null,
    assignee_id: assignee,
    due_on: due,
    created_by: member.id,
  });
  if (error) return { error: 'Nie udało się zapisać zadania.' };
  revalidatePath('/zarzad/zadania');
  return { ok: 'Zadanie przypisane.' };
}

export async function setTaskDone(formData: FormData) {
  const { supabase } = await requireBoard();
  await supabase
    .from('tasks')
    .update({ status: formData.get('done') === '1' ? 'wykonane' : 'w_toku' })
    .eq('id', String(formData.get('task_id') ?? ''));
  revalidatePath('/zarzad/zadania');
}

export async function deleteTask(formData: FormData) {
  const { supabase } = await requireBoard();
  await supabase.from('tasks').delete().eq('id', String(formData.get('task_id') ?? ''));
  revalidatePath('/zarzad/zadania');
}
