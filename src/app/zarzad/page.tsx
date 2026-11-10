import { AppHeader } from '@/components/app-header';
import { formatDate } from '@/lib/format';
import { requireBoard } from '@/lib/session';
import { rejectDeclaration, resetTwoFactor, toggleBlock } from './actions';
import { AddMemberForm, ApproveDeclarationForm, ResetPasswordButton } from './forms';

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase, member: me } = await requireBoard();
  const { q = '' } = await searchParams;
  await supabase.rpc('touch_last_seen');

  const [{ data: members }, { data: dues }, { data: declarations }] = await Promise.all([
    supabase.from('members').select('*').order('member_no'),
    supabase.from('member_dues_status').select('member_id, months_due'),
    supabase.from('declarations').select('*').eq('status', 'oczekuje').order('created_at'),
  ]);

  const dueById = new Map((dues ?? []).map((d) => [d.member_id, d.months_due ?? 0]));
  const query = q.trim().toLowerCase();
  const list = (members ?? []).filter(
    (m) => !query || m.member_no.toLowerCase().includes(query) || `${m.first_name} ${m.last_name}`.toLowerCase().includes(query),
  );
  const activeCount = (members ?? []).filter((m) => m.status === 'aktywny').length;

  return (
    <div className="min-h-screen">
      <AppHeader member={me} area="zarzad" />
      <main className="mx-auto flex max-w-[1360px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold">Członkowie i konta</h1>
            <p className="text-ink-muted">
              Aktywnych członków: {activeCount} · deklaracji do rozpatrzenia: {declarations?.length ?? 0}
            </p>
          </div>
          <a href={`/zarzad/eksport${q ? `?q=${encodeURIComponent(q)}` : ''}`} className="btn-secondary" download>
            Eksport listy (CSV / Excel)
          </a>
        </div>

        {(declarations?.length ?? 0) > 0 && (
          <section className="flex flex-col gap-3" aria-labelledby="dek">
            <h2 id="dek" className="text-xl font-bold">
              Deklaracje członkowskie
            </h2>
            {declarations!.map((d) => (
              <div key={d.id} className="card flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-bold">
                    {d.first_name} {d.last_name}
                  </span>
                  <span className="text-ink-soft">{[d.unit, d.position].filter(Boolean).join(' · ') || '–'}</span>
                  <span className="text-sm text-ink-muted">
                    Złożona {formatDate(d.created_at)} · {d.email}
                  </span>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <ApproveDeclarationForm declarationId={d.id} />
                  <form action={rejectDeclaration}>
                    <input type="hidden" name="declaration_id" value={d.id} />
                    <button type="submit" className="btn-secondary">
                      Odrzuć
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="card flex flex-col gap-3" aria-labelledby="nowy">
          <h2 id="nowy" className="text-lg font-bold">
            Dodaj członka
          </h2>
          <AddMemberForm />
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="lista">
          <h2 id="lista" className="sr-only">
            Lista członków
          </h2>
          <form className="flex max-w-[420px] flex-col gap-1.5" role="search">
            <label htmlFor="q" className="label">
              Szukaj po nazwisku lub numerze
            </label>
            <div className="flex gap-2">
              <input id="q" name="q" type="search" defaultValue={q} className="field" />
              <button type="submit" className="btn-secondary">
                Szukaj
              </button>
            </div>
          </form>
          <div className="overflow-x-auto rounded-[10px] border border-line bg-white">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="text-left text-sm text-ink-muted">
                  <th className="px-4 py-3.5 font-semibold">Nr</th>
                  <th className="px-3 py-3.5 font-semibold">Imię i nazwisko</th>
                  <th className="px-3 py-3.5 font-semibold">Rola</th>
                  <th className="px-3 py-3.5 font-semibold">Data przyjęcia</th>
                  <th className="px-3 py-3.5 font-semibold">Składki</th>
                  <th className="px-3 py-3.5 font-semibold">Konto</th>
                  <th className="px-4 py-3.5 font-semibold">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => {
                  const due = dueById.get(m.id) ?? 0;
                  return (
                    <tr key={m.id} className="border-t border-[#EDF0F3]">
                      <td className="px-4 py-2.5 font-semibold">{m.member_no}</td>
                      <td className="px-3 py-2.5">
                        <a href={`/zarzad/czlonek/${m.id}`} className="font-semibold text-navy underline">
                          {m.first_name} {m.last_name}
                        </a>
                      </td>
                      <td className="px-3 py-2.5 text-ink-soft">{m.is_board ? 'Zarząd' : 'Członek'}</td>
                      <td className="px-3 py-2.5 text-ink-soft">{formatDate(m.joined_at)}</td>
                      <td className="px-3 py-2.5">
                        {due === 0 ? (
                          <span className="chip bg-ok-light py-0.5 text-ok">Opłacone</span>
                        ) : (
                          <span className="chip bg-warn-light py-0.5 text-warn">Zaległość {due} mies.</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-semibold">
                        {m.status === 'aktywny' ? (
                          <span className="text-ok">Aktywne</span>
                        ) : (
                          <span className="text-[#9B1C1C]">Zablokowane</span>
                        )}
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ResetPasswordButton memberId={m.id} />
                          {m.is_board && m.id !== me.id && (
                            <form action={resetTwoFactor}>
                              <input type="hidden" name="member_id" value={m.id} />
                              <button type="submit" className="btn-secondary px-2.5 text-sm">
                                Reset 2FA
                              </button>
                            </form>
                          )}
                          {m.id !== me.id && (
                            <form action={toggleBlock}>
                              <input type="hidden" name="member_id" value={m.id} />
                              <button type="submit" className="btn-secondary px-2.5 text-sm">
                                {m.status === 'aktywny' ? 'Zablokuj' : 'Odblokuj'}
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-ink-muted">
                      Brak członków spełniających kryteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
