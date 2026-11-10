import { MemberShell } from '@/components/shell';
import { formatDate } from '@/lib/format';
import { requireMember } from '@/lib/session';
import { markAllNewsRead, markNewsRead } from './actions';

export default async function NewsPage() {
  const { supabase, member } = await requireMember();

  const [{ data: news }, { data: reads }] = await Promise.all([
    supabase
      .from('news')
      .select('id, title, lead, body, published_at')
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false }),
    supabase.from('news_reads').select('news_id').eq('member_id', member.id),
  ]);

  const readIds = new Set((reads ?? []).map((r) => r.news_id));
  // Treści starsze niż data przyjęcia nie są oznaczane jako nowe
  const isUnread = (n: { id: string; published_at: string }) => !readIds.has(n.id) && n.published_at >= member.joined_at;
  const unread = (news ?? []).filter(isUnread).length;

  return (
    <MemberShell member={member} current="/aktualnosci">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold">Aktualności</h1>
            <span className="text-ink-muted">Najnowsze na górze · nieprzeczytane: {unread}</span>
          </div>
          {unread > 0 && (
            <form action={markAllNewsRead}>
              <button type="submit" className="btn-secondary">
                Oznacz wszystkie jako przeczytane
              </button>
            </form>
          )}
        </div>

        {(news ?? []).map((n) => {
          const fresh = isUnread(n);
          return (
            <article key={n.id} className="card flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-muted">
                  {formatDate(n.published_at)} · Zarząd
                </span>
                {fresh ? (
                  <span className="rounded-full bg-accent px-2 text-xs font-bold text-white">NOWE</span>
                ) : (
                  <span className="text-sm font-semibold text-ok">✓ Przeczytane</span>
                )}
              </div>
              <h2 className="text-xl font-bold">{n.title}</h2>
              {n.lead && <p className="leading-relaxed text-ink-soft">{n.lead}</p>}
              {n.body && (
                <details className="group">
                  <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-semibold text-navy">
                    <span className="group-open:hidden">Czytaj całość</span>
                    <span className="hidden group-open:inline">Zwiń</span>
                  </summary>
                  <p className="whitespace-pre-line leading-relaxed">{n.body}</p>
                </details>
              )}
              {fresh && (
                <form action={markNewsRead}>
                  <input type="hidden" name="news_id" value={n.id} />
                  <button type="submit" className="min-h-[44px] font-semibold text-navy underline">
                    Oznacz jako przeczytane
                  </button>
                </form>
              )}
            </article>
          );
        })}
        {(news ?? []).length === 0 && <p className="text-ink-muted">Brak aktualności.</p>}
    </MemberShell>
  );
}
