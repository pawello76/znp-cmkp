import { BoardShell } from '@/components/shell';
import { formatDate } from '@/lib/format';
import { requireBoard } from '@/lib/session';
import { decideRequest, setCardNumber, toggleBenefitVisible } from './actions';
import { AddBenefitForm, EditBenefitForm } from './forms';

export default async function BoardBenefitsPage() {
  const { supabase, member: me } = await requireBoard();

  const [{ data: benefits }, { data: requests }, { data: members }] = await Promise.all([
    supabase.from('benefits').select('*').order('sort_order'),
    supabase.from('benefit_requests').select('*').order('requested_at', { ascending: false }),
    supabase.from('members').select('id, member_no, first_name, last_name'),
  ]);
  const who = new Map((members ?? []).map((m) => [m.id, `${m.first_name} ${m.last_name}${m.member_no ? ` (${m.member_no})` : ''}`]));
  const benefitName = new Map((benefits ?? []).map((b) => [b.id, b.name]));
  const pending = (requests ?? []).filter((r) => r.status === 'zgloszony');
  const active = (requests ?? []).filter((r) => r.status === 'przyznany');
  const usersOf = (id: string) => active.filter((r) => r.benefit_id === id);

  return (
    <BoardShell member={me} current="/zarzad/benefity">
        <h1 className="text-[28px] font-bold">Benefity</h1>

        <section className="card flex flex-col gap-1" aria-labelledby="zgl">
          <h2 id="zgl" className="mb-2 text-lg font-bold">
            Zgłoszenia do rozpatrzenia ({pending.length})
          </h2>
          {pending.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDF0F3] py-3">
              <span className="flex flex-[1_1_280px] flex-col">
                <span className="font-semibold">{who.get(r.member_id) ?? 'Członek'}</span>
                <span className="text-sm text-ink-muted">
                  {benefitName.get(r.benefit_id)} · zgłoszono {formatDate(r.requested_at)}
                </span>
              </span>
              <span className="flex flex-wrap items-end gap-2">
                <form action={decideRequest} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="request_id" value={r.id} />
                  <input type="hidden" name="decision" value="przyznany" />
                  <span className="flex flex-col gap-1">
                    <label htmlFor={`card-${r.id}`} className="text-sm font-semibold">
                      Nr karty benefitowej
                    </label>
                    <input id={`card-${r.id}`} name="card_number" maxLength={64} className="field h-11 w-48" />
                  </span>
                  <button type="submit" className="btn-primary">
                    Przyznaj
                  </button>
                </form>
                <form action={decideRequest}>
                  <input type="hidden" name="request_id" value={r.id} />
                  <input type="hidden" name="decision" value="odrzucony" />
                  <button type="submit" className="btn-secondary">
                    Odrzuć
                  </button>
                </form>
              </span>
            </div>
          ))}
          {pending.length === 0 && <p className="border-t border-[#EDF0F3] py-3 text-ink-muted">Brak nowych zgłoszeń.</p>}
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="lista">
          <h2 id="lista" className="text-lg font-bold">
            Lista benefitów
          </h2>
          {(benefits ?? []).map((b) => {
            const users = usersOf(b.id);
            return (
              <div key={b.id} className="card flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="font-bold">{b.name}</span>
                    <span className="text-sm text-ink-muted">
                      {b.is_visible ? 'Widoczny dla członków' : 'Ukryty'} · korzysta: {users.length}
                    </span>
                  </span>
                  <form action={toggleBenefitVisible}>
                    <input type="hidden" name="benefit_id" value={b.id} />
                    <input type="hidden" name="visible" value={b.is_visible ? '0' : '1'} />
                    <button type="submit" className="btn-secondary text-sm">
                      {b.is_visible ? 'Ukryj' : 'Pokaż członkom'}
                    </button>
                  </form>
                </div>
                {users.length > 0 && (
                  <details>
                    <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-semibold text-navy">
                      Korzystający ({users.length})
                    </summary>
                    <ul className="flex flex-col">
                      {users.map((r) => (
                        <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EDF0F3] py-2">
                          <span>
                            {who.get(r.member_id)} · od {r.active_from ? formatDate(r.active_from) : '–'}
                          </span>
                          <form action={setCardNumber} className="flex items-center gap-1.5">
                            <input type="hidden" name="request_id" value={r.id} />
                            <label htmlFor={`cn-${r.id}`} className="text-sm text-ink-muted">
                              Nr karty
                            </label>
                            <input id={`cn-${r.id}`} name="card_number" defaultValue={r.card_number ?? ''} maxLength={64} className="field h-11 w-44" />
                            <button type="submit" className="btn-secondary px-2.5 text-sm">
                              Zapisz
                            </button>
                          </form>
                          <form action={decideRequest}>
                            <input type="hidden" name="request_id" value={r.id} />
                            <input type="hidden" name="decision" value="zakonczony" />
                            <button type="submit" className="btn-secondary px-2.5 text-sm">
                              Zakończ
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <details>
                  <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-semibold text-navy">Edytuj opis</summary>
                  <EditBenefitForm benefit={b} />
                </details>
              </div>
            );
          })}
        </section>

        <section className="card flex max-w-[720px] flex-col gap-3" aria-labelledby="nowy">
          <h2 id="nowy" className="text-lg font-bold">
            Dodaj benefit
          </h2>
          <AddBenefitForm />
        </section>
    </BoardShell>
  );
}
