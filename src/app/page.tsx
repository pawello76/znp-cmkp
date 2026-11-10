import { AppHeader } from '@/components/app-header';
import { MemberNav } from '@/components/member-nav';
import { formatDate, formatDateTime, formatMonth } from '@/lib/format';
import { cardValidUntil, requireMember } from '@/lib/session';

export default async function MemberHome() {
  const { supabase, member } = await requireMember();
  await supabase.rpc('touch_last_seen');
  const now = new Date().toISOString();

  const [{ data: dues }, { data: news }, { data: reads }, { data: docs }, { data: acks }, { data: events }, { data: myRegs }] =
    await Promise.all([
      supabase.from('member_dues_status').select('paid_until, months_due').eq('member_id', member.id).maybeSingle(),
      supabase
        .from('news')
        .select('id, title, lead, published_at')
        .eq('is_published', true)
        .lte('published_at', now)
        .order('published_at', { ascending: false }),
      supabase.from('news_reads').select('news_id').eq('member_id', member.id),
      supabase.from('documents').select('id').eq('is_published', true).eq('requires_ack', true).lte('published_at', now),
      supabase.from('document_acks').select('document_id').eq('member_id', member.id),
      supabase.from('events').select('id, title, starts_at, place').eq('is_published', true).gte('starts_at', now).order('starts_at').limit(1),
      supabase.from('event_registrations').select('event_id').eq('member_id', member.id),
    ]);

  const monthsDue = dues?.months_due ?? 0;
  const readIds = new Set((reads ?? []).map((r) => r.news_id));
  const unreadNews = (news ?? []).filter((n) => !readIds.has(n.id) && n.published_at >= member.joined_at);
  const ackIds = new Set((acks ?? []).map((a) => a.document_id));
  const docsToConfirm = (docs ?? []).filter((d) => !ackIds.has(d.id)).length;
  const nextEvent = events?.[0];
  const registeredNext = nextEvent ? (myRegs ?? []).some((r) => r.event_id === nextEvent.id) : false;

  return (
    <div className="min-h-screen">
      <AppHeader member={member} area="czlonek" />
      <MemberNav current="/" />
      <main className="mx-auto flex max-w-[1360px] flex-col gap-5 px-6 py-6">
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[28px] font-bold">Dzień dobry, {member.first_name}</h1>
          <div className="flex flex-wrap gap-2">
            {monthsDue === 0 ? (
              <a href="/skladki" className="chip bg-ok-light text-ok">
                Składki opłacone{dues?.paid_until ? ` do ${formatMonth(dues.paid_until)}` : ''}
              </a>
            ) : (
              <a href="/skladki" className="chip bg-warn-light text-warn">
                Zaległość w składkach: {monthsDue} mies.
              </a>
            )}
            <a href="/legitymacja" className="chip bg-navy-light text-navy">
              Legitymacja ważna do {formatDate(cardValidUntil(member))}
            </a>
            {docsToConfirm > 0 && (
              <a href="/dokumenty" className="chip bg-warn-light text-warn">
                Dokumenty do potwierdzenia: {docsToConfirm}
              </a>
            )}
            {unreadNews.length > 0 && (
              <a href="/aktualnosci" className="chip bg-accent-light text-[#9B1C1C]">
                Nieprzeczytane aktualności: {unreadNews.length}
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          <section className="card flex flex-col gap-2.5">
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">Najbliższe wydarzenie</span>
            {nextEvent ? (
              <>
                <p className="font-semibold leading-snug">{nextEvent.title}</p>
                <p className="text-sm text-ink-muted">
                  {formatDateTime(nextEvent.starts_at)}
                  {nextEvent.place ? ` · ${nextEvent.place}` : ''}
                  {registeredNext ? ' · jesteś zapisana/zapisany' : ''}
                </p>
              </>
            ) : (
              <p className="text-ink-muted">Brak zaplanowanych wydarzeń.</p>
            )}
            <a href="/wydarzenia" className="btn-secondary mt-auto border-navy text-navy">
              Zobacz wydarzenia
            </a>
          </section>
          <section className="card flex flex-col gap-2.5">
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">Cyfrowa legitymacja</span>
            <p className="font-semibold">
              Nr {member.member_no} · członek od {formatDate(member.joined_at)}
            </p>
            <p className="text-sm text-ink-muted">Pokaż legitymację na ekranie lub zapisz jako PDF.</p>
            <a href="/legitymacja" className="btn-secondary mt-auto border-navy text-navy">
              Otwórz legitymację
            </a>
          </section>
        </div>

        <section className="card flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Najnowsze aktualności</h2>
            <a href="/aktualnosci" className="inline-flex min-h-[44px] items-center font-semibold text-navy">
              Wszystkie aktualności →
            </a>
          </div>
          {(news ?? []).slice(0, 3).map((n) => (
            <div key={n.id} className="flex flex-col gap-1 border-t border-[#EDF0F3] py-3.5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-muted">{formatDate(n.published_at)}</span>
                {unreadNews.some((u) => u.id === n.id) && (
                  <span className="rounded-full bg-accent px-2 text-xs font-bold text-white">NOWE</span>
                )}
              </div>
              <span className="font-semibold">{n.title}</span>
              {n.lead && <span className="text-[15px] leading-snug text-ink-soft">{n.lead}</span>}
            </div>
          ))}
          {(news ?? []).length === 0 && <p className="border-t border-[#EDF0F3] py-3.5 text-ink-muted">Brak aktualności.</p>}
        </section>
      </main>
    </div>
  );
}
