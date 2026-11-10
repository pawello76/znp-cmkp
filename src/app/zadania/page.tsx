import { revalidatePath } from 'next/cache';
import { MemberShell } from '@/components/shell';
import { formatDate } from '@/lib/format';
import { requireMember } from '@/lib/session';

async function setTaskStatus(formData: FormData) {
  'use server';
  const { supabase, member } = await requireMember();
  const done = formData.get('done') === '1';
  await supabase
    .from('tasks')
    .update({ status: done ? 'wykonane' : 'w_toku' })
    .eq('id', String(formData.get('task_id') ?? ''))
    .eq('assignee_id', member.id);
  revalidatePath('/zadania');
}

export default async function MyTasksPage() {
  const { supabase, member } = await requireMember();
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assignee_id', member.id)
    .order('status')
    .order('due_on', { ascending: true, nullsFirst: false });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <MemberShell member={member} current="/zadania">
        <h1 className="text-[28px] font-bold">Moje zadania</h1>
        <p className="text-ink-muted">Zadania przypisane Ci przez zarząd. Oznacz wykonane, a zarząd zobaczy zmianę.</p>
        {(tasks ?? []).map((t) => {
          const done = t.status === 'wykonane';
          const late = !done && t.due_on && t.due_on < today;
          return (
            <div key={t.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-[1_1_320px] flex-col gap-1">
                <span className={`font-bold ${done ? 'text-ink-muted line-through' : ''}`}>{t.title}</span>
                {t.description && <span className="whitespace-pre-line text-[15px] text-ink-soft">{t.description}</span>}
                <span className="text-sm text-ink-muted">
                  Termin: {t.due_on ? formatDate(t.due_on) : 'bez terminu'}
                  {done && t.done_at ? ` · wykonane ${formatDate(t.done_at)}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {late && <span className="chip bg-accent-light text-[#9B1C1C]">Po terminie</span>}
                <form action={setTaskStatus}>
                  <input type="hidden" name="task_id" value={t.id} />
                  <input type="hidden" name="done" value={done ? '0' : '1'} />
                  <button type="submit" className={done ? 'btn-secondary' : 'btn-primary'}>
                    {done ? 'Przywróć do realizacji' : 'Oznacz jako wykonane'}
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {(tasks ?? []).length === 0 && <p className="text-ink-muted">Nie masz przypisanych zadań.</p>}
    </MemberShell>
  );
}
