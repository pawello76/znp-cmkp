import { MemberShell } from '@/components/shell';
import { formatAmount, formatDate, formatMonth } from '@/lib/format';
import { requireMember } from '@/lib/session';

export default async function DuesPage({ searchParams }: { searchParams: Promise<{ rok?: string }> }) {
  const { supabase, member } = await requireMember();
  const { rok } = await searchParams;

  const [{ data: payments }, { data: dues }] = await Promise.all([
    supabase.from('dues_payments').select('*').eq('member_id', member.id).order('period_to', { ascending: false }),
    supabase.from('member_dues_status').select('paid_until, months_due').eq('member_id', member.id).maybeSingle(),
  ]);

  const currentYear = new Date().getFullYear();
  const years = [...new Set([currentYear, ...(payments ?? []).map((p) => Number(p.paid_on.slice(0, 4)))])].sort((a, b) => b - a);
  const all = rok === 'wszystkie';
  const year = !all && rok && years.includes(Number(rok)) ? Number(rok) : currentYear;
  const shown = all ? (payments ?? []) : (payments ?? []).filter((p) => p.paid_on.startsWith(String(year)));
  const yearTotal = shown.reduce((sum, p) => sum + p.amount_grosz, 0);
  const last = [...(payments ?? [])].sort((a, b) => b.paid_on.localeCompare(a.paid_on))[0];
  const monthsDue = dues?.months_due ?? 0;

  return (
    <MemberShell member={member} current="/skladki">
        <h1 className="text-[28px] font-bold">Składki</h1>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <div className="card flex flex-col gap-1.5">
            <span className="text-sm text-ink-muted">Status</span>
            {monthsDue === 0 ? (
              <span className="text-[22px] font-bold text-ok">
                {dues?.paid_until ? `Opłacone do ${formatMonth(dues.paid_until)}` : 'Opłacone'}
              </span>
            ) : (
              <span className="text-[22px] font-bold text-warn">Zaległość {monthsDue} mies.</span>
            )}
          </div>
          <div className="card flex flex-col gap-1.5">
            <span className="text-sm text-ink-muted">Ostatnia wpłata</span>
            <span className="text-[22px] font-bold">{last ? formatDate(last.paid_on) : '–'}</span>
          </div>
          <div className="card flex flex-col gap-1.5">
            <span className="text-sm text-ink-muted">{all ? 'Suma wszystkich wpłat' : `Suma wpłat w ${year}`}</span>
            <span className="text-[22px] font-bold">{formatAmount(yearTotal)}</span>
          </div>
          <div className="card flex flex-col gap-1.5">
            <span className="text-sm text-ink-muted">Forma opłaty składek</span>
            <span className="text-[22px] font-bold">
              {member.dues_method === 'pracodawca' ? 'Pracodawca' : member.dues_method === 'przelew' ? 'Przelew' : '–'}
            </span>
          </div>
        </div>

        <nav aria-label="Filtr roku" className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Rok:</span>
          {years.map((y) => {
            const on = !all && y === year;
            return (
              <a
                key={y}
                href={`/skladki?rok=${y}`}
                aria-current={on ? 'page' : undefined}
                className={`chip min-h-[40px] px-3.5 ${on ? 'bg-navy text-white' : 'border border-line bg-white text-navy'}`}
              >
                {y}
              </a>
            );
          })}
          <a
            href="/skladki?rok=wszystkie"
            aria-current={all ? 'page' : undefined}
            className={`chip min-h-[40px] px-3.5 ${all ? 'bg-navy text-white' : 'border border-line bg-white text-navy'}`}
          >
            Wszystkie
          </a>
        </nav>

        <div className="overflow-x-auto rounded-[10px] border border-line bg-white">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr className="text-left text-sm text-ink-muted">
                <th className="px-5 py-3.5 font-semibold">Data wpłaty</th>
                <th className="px-3 py-3.5 font-semibold">Okres</th>
                <th className="px-3 py-3.5 font-semibold">Kwota</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className="border-t border-[#EDF0F3]">
                  <td className="px-5 py-3">{formatDate(p.paid_on)}</td>
                  <td className="px-3 py-3">
                    {p.period_from === p.period_to
                      ? formatMonth(p.period_from)
                      : `${formatMonth(p.period_from)} – ${formatMonth(p.period_to)}`}
                  </td>
                  <td className="px-3 py-3 font-semibold">{formatAmount(p.amount_grosz)}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-5 text-ink-muted">
                    {all ? 'Brak zapisanych wpłat.' : `Brak wpłat w ${year} r.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-ink-muted">
          Składki wpisuje zarząd na podstawie wpłat na konto związku. Widzisz rozbieżność? Napisz do skarbnika.
        </p>
    </MemberShell>
  );
}
