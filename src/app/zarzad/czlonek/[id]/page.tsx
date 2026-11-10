import { notFound } from 'next/navigation';
import { BoardShell } from '@/components/shell';
import { formatAmount, formatDate, formatDateTime, formatMonth } from '@/lib/format';
import { cardValidUntil, requireBoard } from '@/lib/session';
import { deletePayment } from './actions';
import { AddPaymentForm, EditMemberForm } from './forms';

export default async function MemberEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ wplata?: string }>;
}) {
  const { id } = await params;
  const { wplata } = await searchParams;
  const { supabase, member: me } = await requireBoard();

  const [{ data: m }, { data: payments }, { data: dues }, { data: bens }, { data: benefitList }, { data: threads }, { data: regs }] = await Promise.all([
    supabase.from('members').select('*').eq('id', id).maybeSingle(),
    supabase.from('dues_payments').select('*').eq('member_id', id).order('period_to', { ascending: false }),
    supabase.from('member_dues_status').select('paid_until, months_due').eq('member_id', id).maybeSingle(),
    supabase.from('benefit_requests').select('*').eq('member_id', id).in('status', ['przyznany', 'zgloszony']).order('requested_at', { ascending: false }),
    supabase.from('benefits').select('id, name'),
    supabase.from('message_threads').select('id, subject, board_folder, last_message_at, member_last_read_at').eq('member_id', id).order('last_message_at', { ascending: false }),
    supabase.from('event_registrations').select('registered_at, events(id, title, starts_at, place)').eq('member_id', id),
  ]);
  if (!m) notFound();

  // Domyślny okres nowej wpłaty: pierwszy nieopłacony miesiąc
  const base = dues?.paid_until ? new Date(dues.paid_until) : new Date(m.joined_at);
  if (dues?.paid_until) base.setUTCMonth(base.getUTCMonth() + 1);
  const defaultMonth = `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, '0')}`;
  const today = new Date().toISOString().slice(0, 10);
  const monthsDue = dues?.months_due ?? 0;
  const benefitName = new Map((benefitList ?? []).map((b) => [b.id, b.name]));
  const activeBens = (bens ?? []).filter((r) => r.status === 'przyznany');
  const benSum = activeBens.reduce((s, r) => s + (r.value_grosz ?? 0), 0);
  const unreadByBoard = (threads ?? []).filter((t) => t.board_folder === 'aktualne').length;
  const unreadByMember = (threads ?? []).filter((t) => t.last_message_at > t.member_last_read_at).length;
  const nowIso = new Date().toISOString();
  const events = (regs ?? [])
    .flatMap((r) => (r.events ? [{ ...r.events, registered_at: r.registered_at }] : []))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const upcoming = events.filter((e) => e.starts_at >= nowIso).length;
  const FOLDER: Record<string, string> = { aktualne: 'Nieprzeczytana przez zarząd', przeczytane: 'Przeczytana', archiwalne: 'Archiwum' };

  return (
    <BoardShell member={me} current="/zarzad/czlonkowie">
        <a href="/zarzad/czlonkowie" className="self-start font-semibold text-navy">
          ← Wróć do listy członków
        </a>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-bold">
            {m.first_name} {m.last_name}
          </h1>
          <span className="chip bg-navy-light text-navy">login {m.login}</span>
          {m.member_no && <span className="chip bg-navy-light text-navy">nr {m.member_no}</span>}
          {monthsDue === 0 ? (
            <span className="chip bg-ok-light text-ok">
              Składki opłacone{dues?.paid_until ? ` do ${formatMonth(dues.paid_until)}` : ''}
            </span>
          ) : (
            <span className="chip bg-warn-light text-warn">Zaległość {monthsDue} mies.</span>
          )}
          <span className="chip bg-page text-ink-soft">Legitymacja do {formatDate(cardValidUntil(m))}</span>
        </div>

        <section className="card flex flex-col gap-3" aria-labelledby="dane">
          <h2 id="dane" className="text-lg font-bold">
            Dane członka
          </h2>
          <p className="text-sm text-ink-muted">Zmiana loginu działa od razu: członek loguje się nowym loginem i dotychczasowym hasłem.</p>
          <EditMemberForm member={m} isSelf={m.id === me.id} />
        </section>

        <section className="card flex flex-col gap-4" aria-labelledby="skladki">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="skladki" className="text-lg font-bold">
              Składki
            </h2>
            <span className="text-ink-soft">
              Suma wpłat: <strong>{formatAmount((payments ?? []).reduce((s, p) => s + p.amount_grosz, 0))}</strong>
            </span>
          </div>
          <details id="wplata" open={wplata === '1'} className="group">
            <summary className="btn-primary inline-flex cursor-pointer list-none group-open:mb-4 [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">+ Dodaj wpłatę</span>
              <span className="hidden group-open:inline">Zwiń formularz</span>
            </summary>
            <AddPaymentForm memberId={m.id} defaultMonth={defaultMonth} today={today} />
          </details>
          <div className="overflow-x-auto rounded-[10px] border border-line">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="text-left text-sm text-ink-muted">
                  <th className="px-4 py-3 font-semibold">Data wpłaty</th>
                  <th className="px-3 py-3 font-semibold">Okres</th>
                  <th className="px-3 py-3 font-semibold">Kwota</th>
                  <th className="px-3 py-3 font-semibold">Uwagi</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Akcje</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(payments ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-[#EDF0F3]">
                    <td className="px-4 py-2.5">{formatDate(p.paid_on)}</td>
                    <td className="px-3 py-2.5">
                      {p.period_from === p.period_to
                        ? formatMonth(p.period_from)
                        : `${formatMonth(p.period_from)} – ${formatMonth(p.period_to)}`}
                    </td>
                    <td className="px-3 py-2.5 font-semibold">{formatAmount(p.amount_grosz)}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{p.note ?? ''}</td>
                    <td className="px-4 py-1.5 text-right">
                      <form action={deletePayment}>
                        <input type="hidden" name="payment_id" value={p.id} />
                        <input type="hidden" name="member_id" value={m.id} />
                        <button type="submit" className="btn-secondary px-2.5 text-sm">
                          Usuń
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {(payments ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-5 text-ink-muted">
                      Brak zapisanych wpłat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-ink-muted">Każde dodanie i usunięcie wpłaty trafia do dziennika zmian.</p>
        </section>
        <section className="card flex flex-col gap-3" aria-labelledby="benefity">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="benefity" className="text-lg font-bold">
              Benefity
            </h2>
            <span className="text-ink-soft">
              Aktywne: <strong>{activeBens.length}</strong> · łączna wartość: <strong>{formatAmount(benSum)}</strong>
            </span>
          </div>
          <div className="overflow-x-auto rounded-[10px] border border-line">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="text-left text-sm text-ink-muted">
                  <th className="px-4 py-3 font-semibold">Benefit</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Nr karty</th>
                  <th className="px-3 py-3 text-right font-semibold">Wartość</th>
                  <th className="px-4 py-3 font-semibold">Aktywny od</th>
                </tr>
              </thead>
              <tbody>
                {(bens ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-[#EDF0F3]">
                    <td className="px-4 py-2.5 font-semibold">{benefitName.get(r.benefit_id) ?? '–'}</td>
                    <td className="px-3 py-2.5">
                      {r.status === 'przyznany' ? (
                        <span className="chip bg-ok-light py-0.5 text-ok">Aktywny</span>
                      ) : (
                        <span className="chip bg-warn-light py-0.5 text-warn">Zgłoszony</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono">{r.card_number ?? '–'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{r.value_grosz != null ? formatAmount(r.value_grosz) : '–'}</td>
                    <td className="px-4 py-2.5">{r.active_from ? formatDate(r.active_from) : '–'}</td>
                  </tr>
                ))}
                {(bens ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-5 text-ink-muted">
                      Brak benefitów.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <a href="/zarzad/benefity" className="self-start font-semibold text-navy underline">
            Zarządzaj benefitami →
          </a>
        </section>

        <section className="card flex flex-col gap-3" aria-labelledby="wiad">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="wiad" className="text-lg font-bold">
              Wiadomości
            </h2>
            <span className="text-ink-soft">
              Wątków: <strong>{threads?.length ?? 0}</strong> · nieprzeczytane przez zarząd: <strong>{unreadByBoard}</strong> · odpowiedzi
              nieprzeczytane przez członka: <strong>{unreadByMember}</strong>
            </span>
          </div>
          <ul className="flex flex-col">
            {(threads ?? []).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EDF0F3] py-2.5">
                <a href={`/zarzad/wiadomosci/${t.id}`} className="font-semibold text-navy underline">
                  {t.subject}
                </a>
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`chip py-0.5 ${t.board_folder === 'aktualne' ? 'bg-accent-light text-accent' : 'bg-page text-ink-soft'}`}>
                    {FOLDER[t.board_folder] ?? t.board_folder}
                  </span>
                  <span className="text-ink-muted">{formatDateTime(t.last_message_at)}</span>
                </span>
              </li>
            ))}
            {(threads ?? []).length === 0 && <li className="border-t border-[#EDF0F3] py-3 text-ink-muted">Brak wiadomości.</li>}
          </ul>
        </section>

        <section className="card flex flex-col gap-3" aria-labelledby="wyd">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="wyd" className="text-lg font-bold">
              Udział w wydarzeniach
            </h2>
            <span className="text-ink-soft">
              Zapisy: <strong>{events.length}</strong> · nadchodzące: <strong>{upcoming}</strong> · minione: <strong>{events.length - upcoming}</strong>
            </span>
          </div>
          <ul className="flex flex-col">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EDF0F3] py-2.5">
                <span className="flex flex-col">
                  <span className="font-semibold">{e.title}</span>
                  <span className="text-sm text-ink-muted">
                    {formatDateTime(e.starts_at)}
                    {e.place ? ` · ${e.place}` : ''} · zapis {formatDate(e.registered_at)}
                  </span>
                </span>
                {e.starts_at >= nowIso ? (
                  <span className="chip bg-navy-light py-0.5 text-navy">Nadchodzące</span>
                ) : (
                  <span className="chip bg-page py-0.5 text-ink-soft">Minione</span>
                )}
              </li>
            ))}
            {events.length === 0 && <li className="border-t border-[#EDF0F3] py-3 text-ink-muted">Brak zapisów na wydarzenia.</li>}
          </ul>
        </section>
    </BoardShell>
  );
}
