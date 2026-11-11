import { BoardShell } from '@/components/shell';
import { formatAmount, formatDate, formatDateTime } from '@/lib/format';
import { requireBoard } from '@/lib/session';
import { rejectDeclaration } from '../actions';
import { AddMemberForm, ApproveDeclarationForm, ResetPasswordButton } from './forms';

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ q?: string; rok?: string; nowy?: string }> }) {
  const { supabase, member: me } = await requireBoard();
  const { q = '', rok, nowy } = await searchParams;

  const [{ data: members }, { data: dues }, { data: declarations }, { data: payments }, { data: bens }, { data: threads }, { data: regs }] = await Promise.all([
    supabase.from('members').select('*').order('last_name'),
    supabase.from('member_dues_status').select('member_id, months_due'),
    supabase.from('declarations').select('*').eq('status', 'oczekuje').order('created_at'),
    supabase.from('dues_payments').select('member_id, amount_grosz, paid_on'),
    supabase.from('benefit_requests').select('member_id, value_grosz').eq('status', 'przyznany'),
    supabase.from('message_threads').select('member_id').eq('board_folder', 'aktualne'),
    supabase.from('event_registrations').select('member_id'),
  ]);

  const benById = new Map<string, { n: number; sum: number }>();
  for (const b of bens ?? []) {
    const cur = benById.get(b.member_id) ?? { n: 0, sum: 0 };
    benById.set(b.member_id, { n: cur.n + 1, sum: cur.sum + (b.value_grosz ?? 0) });
  }
  const countBy = (rows: { member_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.member_id, (m.get(r.member_id) ?? 0) + 1);
    return m;
  };
  const unreadById = countBy(threads);
  const eventsById = countBy(regs);

  // Suma składek: wybrany rok (domyślnie bieżący) albo wszystkie lata
  const currentYear = new Date().getFullYear();
  const years = [...new Set([currentYear, ...(payments ?? []).map((p) => Number(p.paid_on.slice(0, 4)))])].sort((a, b) => b - a);
  const allYears = rok === 'wszystkie';
  const year = !allYears && rok && years.includes(Number(rok)) ? Number(rok) : currentYear;
  const sumById = new Map<string, number>();
  for (const p of payments ?? []) {
    if (!allYears && !p.paid_on.startsWith(String(year))) continue;
    sumById.set(p.member_id, (sumById.get(p.member_id) ?? 0) + p.amount_grosz);
  }

  const dueById = new Map((dues ?? []).map((d) => [d.member_id, d.months_due ?? 0]));
  const query = q.trim().toLowerCase();
  const list = (members ?? []).filter(
    (m) =>
      !query ||
      m.login.includes(query) ||
      (m.member_no ?? '').toLowerCase().includes(query) ||
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(query),
  );
  const activeCount = (members ?? []).filter((m) => m.status === 'aktywny').length;

  return (
    <BoardShell member={me} current="/zarzad/czlonkowie">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold">Członkowie i konta</h1>
            <p className="text-ink-muted">
              Aktywnych członków: {activeCount} ·{' '}
              {(declarations?.length ?? 0) > 0 ? (
                <a href="#dek" className="font-semibold text-accent underline">
                  deklaracji do rozpatrzenia: {declarations!.length}
                </a>
              ) : (
                'deklaracji do rozpatrzenia: 0'
              )}
            </p>
          </div>
          <a href={`/zarzad/eksport?${new URLSearchParams({ ...(q ? { q } : {}), rok: allYears ? 'wszystkie' : String(year) })}`} className="btn-secondary" download>
            Eksport listy (CSV / Excel)
          </a>
        </div>

        <section className="flex flex-col gap-3" aria-labelledby="lista">
          <h2 id="lista" className="sr-only">
            Lista członków
          </h2>
          <form className="flex flex-wrap items-end gap-3" role="search">
            <div className="flex flex-[1_1_280px] flex-col gap-1.5 sm:max-w-[420px]">
              <label htmlFor="q" className="label">
                Szukaj po nazwisku, loginie lub numerze
              </label>
              <input id="q" name="q" type="search" defaultValue={q} className="field" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rok" className="label">
                Suma składek za
              </label>
              <select id="rok" name="rok" defaultValue={allYears ? 'wszystkie' : String(year)} className="field w-44">
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
                <option value="wszystkie">wszystkie lata</option>
              </select>
            </div>
            <button type="submit" className="btn-secondary">
              Pokaż
            </button>
          </form>
          <div className="overflow-x-auto rounded-[10px] border border-line bg-white">
            <table className="w-full min-w-[1400px] text-sm border-collapse">
              <thead>
                <tr className="text-left text-[13px] leading-tight text-ink-muted">
                  <th className="px-3 py-2 font-semibold">Login</th>
                  <th className="px-2 py-2 font-semibold">Nr czł.</th>
                  <th className="px-2 py-2 font-semibold">Imię i nazwisko</th>
                  <th className="px-2 py-2 font-semibold">Rola</th>
                  <th className="px-2 py-2 font-semibold">Przyjęty</th>
                  <th className="px-2 py-2 font-semibold">Status składek</th>
                  <th className="px-2 py-2 font-semibold">Forma opłaty</th>
                  <th className="px-2 py-2 text-right font-semibold">Składki {allYears ? 'razem' : year}</th>
                  <th className="px-2 py-2 text-right font-semibold">Benefity</th>
                  <th className="px-2 py-2 text-right font-semibold">Wart. benefitów</th>
                  <th className="px-2 py-2 text-right font-semibold">Nieprzecz. wiad.</th>
                  <th className="px-2 py-2 text-right font-semibold">Wydarzenia</th>
                  <th className="px-2 py-2 font-semibold">Konto</th>
                  <th className="px-2 py-2 font-semibold">Ostatnie logowanie</th>
                  <th className="px-3 py-2 font-semibold">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => {
                  const due = dueById.get(m.id) ?? 0;
                  return (
                    <tr key={m.id} className="border-t border-[#EDF0F3]">
                      <td className="px-3 py-1.5 font-semibold">{m.login}</td>
                      <td className="px-2 py-1.5 text-ink-soft">{m.member_no ?? '–'}</td>
                      <td className="px-2 py-1.5">
                        <a href={`/zarzad/czlonek/${m.id}`} className="whitespace-nowrap font-semibold text-navy underline">
                          {m.first_name} {m.last_name}
                        </a>
                      </td>
                      <td className="px-2 py-1.5 text-ink-soft">{m.is_board ? 'Zarząd' : 'Członek'}</td>
                      <td className="px-2 py-1.5 text-ink-soft">{formatDate(m.joined_at)}</td>
                      <td className="px-2 py-1.5">
                        {due === 0 ? (
                          <span className="chip whitespace-nowrap bg-ok-light px-2 py-0 text-[13px] text-ok">Opłacone</span>
                        ) : (
                          <span className="chip whitespace-nowrap bg-warn-light px-2 py-0 text-[13px] text-warn">Zaległość {due} mies.</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-ink-soft">
                        {m.dues_method === 'pracodawca' ? 'Pracodawca' : m.dues_method === 'przelew' ? 'Przelew' : '–'}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right font-semibold tabular-nums">
                        {formatAmount(sumById.get(m.id) ?? 0)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{benById.get(m.id)?.n ?? 0}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">{formatAmount(benById.get(m.id)?.sum ?? 0)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {(unreadById.get(m.id) ?? 0) > 0 ? (
                          <span className="chip bg-accent-light py-0.5 text-accent">{unreadById.get(m.id)}</span>
                        ) : (
                          0
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{eventsById.get(m.id) ?? 0}</td>
                      <td className="px-2 py-1.5 font-semibold">
                        {m.status === 'aktywny' ? (
                          <span className="text-ok">Aktywne</span>
                        ) : (
                          <span className="text-[#9B1C1C]">Zablokowane</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-ink-soft">{m.last_seen_at ? formatDateTime(m.last_seen_at) : '-'}</td>
                      <td className="whitespace-nowrap px-3 py-1.5">
                        <span className="flex items-center gap-3">
                          <a href={`/zarzad/czlonek/${m.id}?wplata=1#wplata`} className="font-semibold text-navy underline">
                            Dodaj wpłatę
                          </a>
                          <ResetPasswordButton memberId={m.id} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={15} className="px-4 py-6 text-ink-muted">
                      Brak członków spełniających kryteria.
                    </td>
                  </tr>
                )}
              </tbody>
              {list.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-line bg-page">
                    <td colSpan={7} className="px-4 py-3 font-semibold">
                      Razem ({list.length} {list.length === 1 ? 'osoba' : 'osób'})
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums">
                      {formatAmount(list.reduce((s, m) => s + (sumById.get(m.id) ?? 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">
                      {list.reduce((s, m) => s + (benById.get(m.id)?.n ?? 0), 0)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums">
                      {formatAmount(list.reduce((s, m) => s + (benById.get(m.id)?.sum ?? 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">
                      {list.reduce((s, m) => s + (unreadById.get(m.id) ?? 0), 0)}
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">
                      {list.reduce((s, m) => s + (eventsById.get(m.id) ?? 0), 0)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        <details id="nowy" open={nowy === '1'} className="group card flex flex-col">
          <summary className="btn-primary inline-flex cursor-pointer list-none self-start group-open:mb-4 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">+ Dodaj nowego członka</span>
            <span className="hidden group-open:inline">Zwiń formularz</span>
          </summary>
          <AddMemberForm />
        </details>

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
    </BoardShell>
  );
}
