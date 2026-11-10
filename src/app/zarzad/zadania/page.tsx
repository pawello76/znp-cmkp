import { AppHeader } from '@/components/app-header';
import { BoardNav } from '@/components/board-nav';
import { formatDate } from '@/lib/format';
import { requireBoard } from '@/lib/session';
import { deleteTask, setTaskDone } from './actions';
import { AddTaskForm } from './form';

export default async function BoardTasksPage() {
  const { supabase, member: me } = await requireBoard();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: tasks }, { data: members }] = await Promise.all([
    supabase.from('tasks').select('*').order('status').order('due_on', { ascending: true, nullsFirst: false }),
    supabase.from('members').select('id, member_no, first_name, last_name, is_board, status').order('last_name'),
  ]);
  const byId = new Map((members ?? []).map((m) => [m.id, m]));
  const people = (members ?? [])
    .filter((m) => m.status === 'aktywny')
    .map((m) => ({ id: m.id, label: `${m.first_name} ${m.last_name} (${m.member_no})`, board: m.is_board }));

  return (
    <div className="min-h-screen">
      <AppHeader member={me} area="zarzad" />
      <BoardNav current="/zarzad/zadania" />
      <main className="mx-auto flex max-w-[1360px] flex-col gap-6 px-6 py-6">
        <h1 className="text-[28px] font-bold">Zadania</h1>
        <section className="card flex flex-col gap-3" aria-labelledby="nowe">
          <h2 id="nowe" className="text-lg font-bold">
            Nowe zadanie
          </h2>
          <AddTaskForm people={people} />
        </section>

        <section className="card flex flex-col gap-0 py-2" aria-label="Lista zadań">
          {(tasks ?? []).map((t) => {
            const done = t.status === 'wykonane';
            const late = !done && t.due_on && t.due_on < today;
            const who = byId.get(t.assignee_id);
            return (
              <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-[#EDF0F3] py-3 last:border-b-0">
                <div className="flex flex-[1_1_320px] flex-col">
                  <span className={`font-semibold ${done ? 'text-ink-muted line-through' : ''}`}>{t.title}</span>
                  <span className="text-sm text-ink-muted">
                    {who ? `${who.first_name} ${who.last_name}${who.is_board ? ' (zarząd)' : ''}` : '–'} · termin{' '}
                    {t.due_on ? formatDate(t.due_on) : 'brak'}
                  </span>
                </div>
                {done ? (
                  <span className="chip bg-ok-light text-ok">Wykonane</span>
                ) : late ? (
                  <span className="chip bg-accent-light text-[#9B1C1C]">Po terminie</span>
                ) : (
                  <span className="chip bg-navy-light text-navy">W toku</span>
                )}
                <form action={setTaskDone}>
                  <input type="hidden" name="task_id" value={t.id} />
                  <input type="hidden" name="done" value={done ? '0' : '1'} />
                  <button type="submit" className="btn-secondary text-sm">
                    {done ? 'Przywróć' : 'Oznacz jako wykonane'}
                  </button>
                </form>
                <form action={deleteTask}>
                  <input type="hidden" name="task_id" value={t.id} />
                  <button type="submit" className="btn-secondary text-sm text-[#9B1C1C]">
                    Usuń
                  </button>
                </form>
              </div>
            );
          })}
          {(tasks ?? []).length === 0 && <p className="py-3 text-ink-muted">Brak zadań.</p>}
        </section>
      </main>
    </div>
  );
}
