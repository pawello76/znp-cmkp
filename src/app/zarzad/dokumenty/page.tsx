import { BoardShell } from '@/components/shell';
import { formatDate } from '@/lib/format';
import { requireBoard } from '@/lib/session';
import { deleteDocument, togglePublishDocument } from './actions';
import { UploadDocumentForm } from './upload-form';

export default async function BoardDocumentsPage() {
  const { supabase, member: me } = await requireBoard();

  const [{ data: docs }, { data: cats }, { data: acks }, { count: activeCount }] = await Promise.all([
    supabase.from('documents').select('*').order('published_at', { ascending: false }),
    supabase.from('document_categories').select('id, name').order('sort_order'),
    supabase.from('document_acks').select('document_id'),
    supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'aktywny'),
  ]);

  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const ackCount = new Map<string, number>();
  for (const a of acks ?? []) ackCount.set(a.document_id, (ackCount.get(a.document_id) ?? 0) + 1);
  const total = activeCount ?? 0;

  return (
    <BoardShell member={me} current="/zarzad/dokumenty">
        <h1 className="text-[28px] font-bold">Dokumenty</h1>

        <section className="card flex flex-col gap-3" aria-labelledby="wgraj">
          <h2 id="wgraj" className="text-lg font-bold">
            Wgraj dokument
          </h2>
          <UploadDocumentForm categories={cats ?? []} />
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="lista">
          <h2 id="lista" className="text-lg font-bold">
            Wszystkie dokumenty
          </h2>
          {(docs ?? []).map((d) => {
            const n = ackCount.get(d.id) ?? 0;
            const pct = total ? Math.round((n / total) * 100) : 0;
            return (
              <div key={d.id} className="card flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-[1_1_300px] flex-col gap-0.5">
                    <a href={`/dokumenty/${d.id}/pobierz`} className="font-bold text-navy underline">
                      {d.title}
                    </a>
                    <span className="text-sm text-ink-muted">
                      {(d.category_id && catName.get(d.category_id)) || 'Dokument'} · {formatDate(d.published_at)}
                      {d.is_published ? '' : ' · nieopublikowany'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={togglePublishDocument}>
                      <input type="hidden" name="document_id" value={d.id} />
                      <input type="hidden" name="publish" value={d.is_published ? '0' : '1'} />
                      <button type="submit" className="btn-secondary text-sm">
                        {d.is_published ? 'Wycofaj publikację' : 'Opublikuj'}
                      </button>
                    </form>
                    <form action={deleteDocument}>
                      <input type="hidden" name="document_id" value={d.id} />
                      <button type="submit" className="btn-secondary text-sm text-[#9B1C1C]">
                        Usuń
                      </button>
                    </form>
                  </div>
                </div>
                {d.requires_ack ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[15px]">
                      Potwierdziło <strong>{n}</strong> z {total}
                    </span>
                    <div
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Odsetek potwierdzeń"
                      className="h-2 w-full max-w-[320px] overflow-hidden rounded-full bg-navy-light"
                    >
                      <div className="h-full bg-navy" style={{ width: `${pct}%` }} />
                    </div>
                    <a href={`/zarzad/dokumenty/${d.id}/brak-potwierdzen`} className="text-sm font-semibold text-navy underline" download>
                      Lista bez potwierdzenia (CSV)
                    </a>
                  </div>
                ) : (
                  <span className="text-sm text-ink-muted">Bez potwierdzenia odczytu</span>
                )}
              </div>
            );
          })}
          {(docs ?? []).length === 0 && <p className="text-ink-muted">Brak dokumentów.</p>}
        </section>
    </BoardShell>
  );
}
