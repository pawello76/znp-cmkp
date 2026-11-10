import { AppHeader } from '@/components/app-header';
import { BoardNav } from '@/components/board-nav';
import { formatDateTime, formatTime } from '@/lib/format';
import { requireBoard } from '@/lib/session';
import { deleteEvent, toggleRegistrationOpen } from './actions';
import { AddEventForm } from './form';

export default async function BoardEventsPage() {
  const { supabase, member: me } = await requireBoard();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [{ data: events }, { data: regs }, { data: members }] = await Promise.all([
    supabase.from('events').select('*').gte('starts_at', since).order('starts_at'),
    supabase.from('event_registrations').select('event_id, member_id, registered_at'),
    supabase.from('members').select('id, member_no, first_name, last_name'),
  ]);

  const byId = new Map((members ?? []).map((m) => [m.id, m]));
  const regsByEvent = new Map<string, { member_id: string; registered_at: string }[]>();
  for (const r of regs ?? []) {
    const list = regsByEvent.get(r.event_id) ?? [];
    list.push(r);
    regsByEvent.set(r.event_id, list);
  }
  const now = new Date().toISOString();

  return (
    <div className="min-h-screen">
      <AppHeader member={me} area="zarzad" />
      <BoardNav current="/zarzad/wydarzenia" />
      <main className="mx-auto flex max-w-[1360px] flex-col gap-6 px-6 py-6">
        <h1 className="text-[28px] font-bold">Wydarzenia</h1>

        <section className="card flex flex-col gap-3" aria-labelledby="nowe">
          <h2 id="nowe" className="text-lg font-bold">
            Nowe wydarzenie
          </h2>
          <AddEventForm />
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="lista">
          <h2 id="lista" className="text-lg font-bold">
            Nadchodzące i z ostatnich 30 dni
          </h2>
          {(events ?? []).map((e) => {
            const list = (regsByEvent.get(e.id) ?? []).sort((a, b) => a.registered_at.localeCompare(b.registered_at));
            const past = e.starts_at < now;
            return (
              <div key={e.id} className="card flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-[1_1_300px] flex-col gap-0.5">
                    <span className="font-bold">{e.title}</span>
                    <span className="text-sm text-ink-muted">
                      {formatDateTime(e.starts_at)}
                      {e.ends_at ? `–${formatTime(e.ends_at)}` : ''}
                      {e.place ? ` · ${e.place}` : ''}
                      {past ? ' · zakończone' : ''}
                    </span>
                    <span className="text-[15px]">
                      Zapisanych: <strong>{list.length}</strong>
                      {e.capacity ? ` z ${e.capacity}` : ''}
                      {!e.registration_open && !past ? ' · zapisy zamknięte' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!past && (
                      <form action={toggleRegistrationOpen}>
                        <input type="hidden" name="event_id" value={e.id} />
                        <input type="hidden" name="open" value={e.registration_open ? '0' : '1'} />
                        <button type="submit" className="btn-secondary text-sm">
                          {e.registration_open ? 'Zamknij zapisy' : 'Otwórz zapisy'}
                        </button>
                      </form>
                    )}
                    <form action={deleteEvent}>
                      <input type="hidden" name="event_id" value={e.id} />
                      <button type="submit" className="btn-secondary text-sm text-[#9B1C1C]">
                        Usuń
                      </button>
                    </form>
                  </div>
                </div>
                {list.length > 0 && (
                  <details>
                    <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-semibold text-navy">
                      Lista uczestników ({list.length})
                    </summary>
                    <ol className="ml-6 list-decimal text-[15px] leading-7">
                      {list.map((r) => {
                        const m = byId.get(r.member_id);
                        return <li key={r.member_id}>{m ? `${m.first_name} ${m.last_name} (${m.member_no})` : r.member_id}</li>;
                      })}
                    </ol>
                  </details>
                )}
              </div>
            );
          })}
          {(events ?? []).length === 0 && <p className="text-ink-muted">Brak wydarzeń.</p>}
        </section>
      </main>
    </div>
  );
}
