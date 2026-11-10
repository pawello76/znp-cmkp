import { MemberShell } from '@/components/shell';
import { formatDate, formatDateTime, formatMonth } from '@/lib/format';
import { cardValidUntil, requireMember } from '@/lib/session';

const cardLabel = 'text-[13px] font-bold uppercase tracking-[0.06em]';

export default async function MemberHome() {
  const { supabase, member } = await requireMember();
  await supabase.rpc('touch_last_seen');
  const now = new Date().toISOString();

  const [{ data: dues }, { data: news }, { data: reads }, { data: docs }, { data: acks }, { data: events }, { data: myRegs }, { data: threads }] =
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
      supabase.from('events').select('id, title, starts_at, place').eq('is_published', true).gte('starts_at', now).order('starts_at'),
      supabase.from('event_registrations').select('event_id').eq('member_id', member.id),
      supabase.from('message_threads').select('last_message_at, member_last_read_at').eq('member_id', member.id),
    ]);

  const monthsDue = dues?.months_due ?? 0;
  const readIds = new Set((reads ?? []).map((r) => r.news_id));
  const unreadNews = (news ?? []).filter((n) => !readIds.has(n.id) && n.published_at >= member.joined_at);
  const ackIds = new Set((acks ?? []).map((a) => a.document_id));
  const docsToConfirm = (docs ?? []).filter((d) => !ackIds.has(d.id)).length;
  const newReplies = (threads ?? []).filter((t) => t.last_message_at > t.member_last_read_at).length;
  const nextEvent = events?.[0];
  const moreEvents = Math.max(0, (events?.length ?? 0) - 1);
  const registeredNext = nextEvent ? (myRegs ?? []).some((r) => r.event_id === nextEvent.id) : false;
  const todo = docsToConfirm + newReplies;

  return (
    <MemberShell member={member} current="/">
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
              {docsToConfirm === 1 ? '1 dokument do potwierdzenia' : `Dokumenty do potwierdzenia: ${docsToConfirm}`}
            </a>
          )}
          {newReplies > 0 && (
            <a href="/kontakt" className="chip bg-accent-light text-[#9B1C1C]">
              Nowa odpowiedź od zarządu
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <section className="card flex flex-col gap-2.5">
          <span className={`${cardLabel} ${todo > 0 ? 'text-accent' : 'text-ink-muted'}`}>Do załatwienia</span>
          {todo > 0 ? (
            <ul className="flex flex-col gap-1 font-semibold leading-snug">
              {docsToConfirm > 0 && <li>Potwierdź zapoznanie się z dokumentami: {docsToConfirm}</li>}
              {newReplies > 0 && <li>Przeczytaj odpowiedź zarządu: {newReplies}</li>}
            </ul>
          ) : (
            <p className="font-semibold">Wszystko załatwione</p>
          )}
          <p className="text-sm text-ink-muted">Nieprzeczytane aktualności: {unreadNews.length}</p>
          <a
            href={docsToConfirm > 0 ? '/dokumenty' : newReplies > 0 ? '/kontakt' : '/aktualnosci'}
            className={`mt-auto ${todo > 0 ? 'btn-danger' : 'btn-secondary border-navy text-navy'}`}
          >
            {docsToConfirm > 0 ? 'Przejdź do dokumentów' : newReplies > 0 ? 'Otwórz wiadomości' : 'Zobacz aktualności'}
          </a>
        </section>

        <section className="card flex flex-col gap-2.5">
          <span className={`${cardLabel} text-ink-muted`}>Najbliższe wydarzenie</span>
          {nextEvent ? (
            <>
              <p className="font-semibold leading-snug">{nextEvent.title}</p>
              <p className="text-sm text-ink-muted">
                {formatDateTime(nextEvent.starts_at)}
                {nextEvent.place ? ` · ${nextEvent.place}` : ''}
                {registeredNext ? ' · jesteś zapisana/zapisany' : ''}
              </p>
              {moreEvents > 0 && (
                <a href="/wydarzenia" className="self-start rounded-full bg-navy-light px-3 py-1 text-sm font-semibold text-navy">
                  + {moreEvents} {moreEvents === 1 ? 'kolejne wydarzenie' : moreEvents < 5 ? 'kolejne wydarzenia' : 'kolejnych wydarzeń'}
                </a>
              )}
            </>
          ) : (
            <p className="text-ink-muted">Brak zaplanowanych wydarzeń.</p>
          )}
          <a href="/wydarzenia" className="btn-secondary mt-auto border-navy text-navy">
            {moreEvents > 0 ? 'Zobacz wszystkie wydarzenia' : 'Zobacz wydarzenia'}
          </a>
        </section>

        <section className="card flex flex-col gap-2.5">
          <span className={`${cardLabel} text-ink-muted`}>Cyfrowa legitymacja</span>
          <p className="font-semibold">
            {member.member_no ? `Nr ${member.member_no} · ` : ''}członek od {formatDate(member.joined_at)}
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
    </MemberShell>
  );
}
