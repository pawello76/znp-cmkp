import { AppHeader } from '@/components/app-header';
import { formatDate, formatMonth } from '@/lib/format';
import { MemberNav } from '@/components/member-nav';
import { cardValidUntil, requireMember } from '@/lib/session';

export default async function MemberHome() {
  const { supabase, member } = await requireMember();
  await supabase.rpc('touch_last_seen');

  const { data: dues } = await supabase
    .from('member_dues_status')
    .select('paid_until, months_due')
    .eq('member_id', member.id)
    .maybeSingle();

  const monthsDue = dues?.months_due ?? 0;

  return (
    <div className="min-h-screen">
      <AppHeader member={member} area="czlonek" />
      <MemberNav current="/" />
      <main className="mx-auto flex max-w-[1360px] flex-col gap-5 px-6 py-6">
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[28px] font-bold">Dzień dobry, {member.first_name}</h1>
          <div className="flex flex-wrap gap-2">
            {monthsDue === 0 ? (
              <span className="chip bg-ok-light text-ok">
                Składki opłacone{dues?.paid_until ? ` do ${formatMonth(dues.paid_until)}` : ''}
              </span>
            ) : (
              <span className="chip bg-warn-light text-warn">
                Zaległość w składkach: {monthsDue} mies.
              </span>
            )}
            <a href="/legitymacja" className="chip bg-navy-light text-navy">
              Legitymacja ważna do {formatDate(cardValidUntil(member))}
            </a>
          </div>
        </div>

        <section className="card flex max-w-[560px] flex-col gap-3">
          <h2 className="text-xl font-bold">Twoje dane</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2">
              <dt className="text-[13px] text-ink-muted">Imię i nazwisko</dt>
              <dd className="text-xl font-bold">
                {member.first_name} {member.last_name}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-muted">Numer członkowski</dt>
              <dd className="font-semibold">{member.member_no}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-muted">Data przyjęcia</dt>
              <dd className="font-semibold">{formatDate(member.joined_at)}</dd>
            </div>
          </dl>
          <a href="/legitymacja" className="self-start font-semibold text-navy underline">
            Otwórz legitymację
          </a>
        </section>

        <p className="text-ink-muted">
          Kolejne moduły (aktualności, głosowania, wydarzenia, dokumenty, benefity, składki, kontakt) pojawią się w
          następnych etapach.
        </p>
      </main>
    </div>
  );
}
