import { AppHeader } from '@/components/app-header';
import { BoardNav } from '@/components/board-nav';
import { formatDate } from '@/lib/format';
import { requireBoard } from '@/lib/session';
import { deleteNews, togglePublishNews } from './actions';
import { AddNewsForm } from './form';

export default async function BoardNewsPage() {
  const { supabase, member: me } = await requireBoard();

  const [{ data: news }, { data: reads }, { count: activeCount }] = await Promise.all([
    supabase.from('news').select('*').order('published_at', { ascending: false }),
    supabase.from('news_reads').select('news_id'),
    supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'aktywny'),
  ]);

  const readCount = new Map<string, number>();
  for (const r of reads ?? []) readCount.set(r.news_id, (readCount.get(r.news_id) ?? 0) + 1);

  return (
    <div className="min-h-screen">
      <AppHeader member={me} area="zarzad" />
      <BoardNav current="/zarzad/aktualnosci" />
      <main className="mx-auto flex max-w-[1360px] flex-col gap-6 px-6 py-6">
        <h1 className="text-[28px] font-bold">Aktualności</h1>

        <section className="card flex flex-col gap-3" aria-labelledby="nowa">
          <h2 id="nowa" className="text-lg font-bold">
            Nowa aktualność
          </h2>
          <AddNewsForm />
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="lista">
          <h2 id="lista" className="text-lg font-bold">
            Opublikowane i szkice
          </h2>
          {(news ?? []).map((n) => (
            <div key={n.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-[1_1_320px] flex-col gap-1">
                <span className="font-bold">{n.title}</span>
                <span className="text-sm text-ink-muted">
                  {n.is_published
                    ? `Opublikowano ${formatDate(n.published_at)} · przeczytało ${readCount.get(n.id) ?? 0} z ${activeCount ?? 0}`
                    : 'Szkic – niewidoczny dla członków'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={togglePublishNews}>
                  <input type="hidden" name="news_id" value={n.id} />
                  <input type="hidden" name="publish" value={n.is_published ? '0' : '1'} />
                  <button type="submit" className="btn-secondary text-sm">
                    {n.is_published ? 'Wycofaj publikację' : 'Opublikuj'}
                  </button>
                </form>
                <form action={deleteNews}>
                  <input type="hidden" name="news_id" value={n.id} />
                  <button type="submit" className="btn-secondary text-sm text-[#9B1C1C]">
                    Usuń
                  </button>
                </form>
              </div>
            </div>
          ))}
          {(news ?? []).length === 0 && <p className="text-ink-muted">Brak aktualności.</p>}
        </section>
      </main>
    </div>
  );
}
