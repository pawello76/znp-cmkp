import { revalidatePath } from 'next/cache';
import { MemberShell } from '@/components/shell';
import { formatAmount, formatDate } from '@/lib/format';
import { requireMember } from '@/lib/session';

async function requestBenefit(formData: FormData) {
  'use server';
  const { supabase, member } = await requireMember();
  await supabase.from('benefit_requests').insert({
    benefit_id: String(formData.get('benefit_id') ?? ''),
    member_id: member.id,
    status: 'zgloszony',
  });
  revalidatePath('/benefity');
}

export default async function BenefitsPage() {
  const { supabase, member } = await requireMember();

  const [{ data: benefits }, { data: requests }] = await Promise.all([
    supabase.from('benefits').select('*').eq('is_visible', true).order('sort_order'),
    supabase.from('benefit_requests').select('*').eq('member_id', member.id).order('requested_at', { ascending: false }),
  ]);

  // Najnowsze zgłoszenie na dany benefit decyduje o statusie
  const latest = new Map<string, NonNullable<typeof requests>[number]>();
  for (const r of requests ?? []) if (!latest.has(r.benefit_id)) latest.set(r.benefit_id, r);
  const mine = (benefits ?? []).filter((b) => {
    const s = latest.get(b.id)?.status;
    return s === 'przyznany' || s === 'zgloszony';
  });

  return (
    <MemberShell member={member} current="/benefity">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold">Korzyści i benefity</h1>
          <p className="text-ink-muted">Listę benefitów prowadzi zarząd. Po zgłoszeniu zarząd potwierdza przyznanie benefitu.</p>
        </div>

        <section className="card flex flex-col gap-2.5" aria-labelledby="moje">
          <h2 id="moje" className="text-xl font-bold">
            Moje benefity
          </h2>
          {mine.map((b) => {
            const r = latest.get(b.id)!;
            return (
              <div key={b.id} className="flex flex-col gap-2 border-t border-[#EDF0F3] pt-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold">
                    {b.name}
                    {b.value_grosz != null && <span className="font-normal text-ink-muted"> · wartość {formatAmount(b.value_grosz)}</span>}
                  </span>
                  {r.status === 'przyznany' ? (
                    <span className="chip bg-ok-light text-ok">
                      Aktywny{r.active_from ? ` od ${formatDate(r.active_from)}` : ''}
                    </span>
                  ) : (
                    <span className="chip bg-warn-light text-warn">Zgłoszony · czeka na potwierdzenie zarządu</span>
                  )}
                </div>
                {r.status === 'przyznany' && (
                  <dl className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 rounded-lg bg-page p-3">
                    <div className="flex flex-col">
                      <dt className="text-sm text-ink-muted">Numer karty</dt>
                      <dd className="font-mono text-[17px] font-bold">{r.card_number ?? <span className="font-sans text-[15px] font-normal text-ink-muted">nada zarząd</span>}</dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-sm text-ink-muted">Data wydania karty</dt>
                      <dd className="text-[17px] font-bold">{r.card_issued_on ? formatDate(r.card_issued_on) : <span className="text-[15px] font-normal text-ink-muted">–</span>}</dd>
                    </div>
                  </dl>
                )}
              </div>
            );
          })}
          {mine.length === 0 && <p className="text-ink-muted">Nie korzystasz jeszcze z żadnego benefitu.</p>}
        </section>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {(benefits ?? []).map((b) => {
            const req = latest.get(b.id);
            const status = req?.status;
            return (
              <div key={b.id} className="card flex flex-col gap-2.5">
                {b.category && (
                  <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">{b.category}</span>
                )}
                <h2 className="text-xl font-bold">{b.name}</h2>
                {b.value_grosz != null && <span className="font-semibold text-navy">Wartość: {formatAmount(b.value_grosz)}</span>}
                {b.description && <p className="whitespace-pre-line leading-relaxed text-ink-soft">{b.description}</p>}
                {status === 'przyznany' ? (
                  <span className="mt-auto flex flex-col gap-0.5 rounded-lg bg-ok-light p-3 text-ok">
                    <span className="font-semibold">✓ Masz ten benefit</span>
                    <span className="text-[15px] text-ink">
                      Nr karty: <strong className="font-mono">{req?.card_number ?? 'nada zarząd'}</strong>
                    </span>
                    {req?.card_issued_on && <span className="text-[15px] text-ink">Wydana: {formatDate(req.card_issued_on)}</span>}
                  </span>
                ) : status === 'zgloszony' ? (
                  <span className="mt-auto rounded-lg bg-warn-light p-3 font-semibold text-warn">Zgłoszono · czeka na potwierdzenie</span>
                ) : (
                  <form action={requestBenefit} className="mt-auto flex flex-col gap-1.5">
                    {status === 'odrzucony' && <span className="text-sm text-ink-muted">Poprzednie zgłoszenie odrzucono.</span>}
                    <input type="hidden" name="benefit_id" value={b.id} />
                    <button type="submit" className="btn-primary">
                      Zgłoś chęć skorzystania
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
        {(benefits ?? []).length === 0 && <p className="text-ink-muted">Brak dostępnych benefitów.</p>}
    </MemberShell>
  );
}
