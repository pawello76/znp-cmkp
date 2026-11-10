import { MemberShell } from '@/components/shell';
import { formatDate } from '@/lib/format';
import { requireMember } from '@/lib/session';
import { acknowledgeDocument } from './actions';

export default async function DocumentsPage() {
  const { supabase, member } = await requireMember();

  const [{ data: docs }, { data: cats }, { data: acks }] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, category_id, requires_ack, published_at')
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false }),
    supabase.from('document_categories').select('id, name'),
    supabase.from('document_acks').select('document_id, acked_at').eq('member_id', member.id),
  ]);

  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const ackAt = new Map((acks ?? []).map((a) => [a.document_id, a.acked_at]));
  const toConfirm = (docs ?? []).filter((d) => d.requires_ack && !ackAt.has(d.id)).length;

  return (
    <MemberShell member={member} current="/dokumenty">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold">Dokumenty</h1>
          <span className="text-ink-muted">
            Dokumenty oznaczone przez zarząd wymagają potwierdzenia, że się z nimi zapoznałaś/zapoznałeś.
            {toConfirm > 0 ? ` Do potwierdzenia: ${toConfirm}.` : ''}
          </span>
        </div>

        {(docs ?? []).map((d) => {
          const acked = ackAt.get(d.id);
          return (
            <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3.5">
              <div className="flex flex-[1_1_320px] flex-col gap-1">
                <span className="font-bold">{d.title}</span>
                <span className="text-sm text-ink-muted">
                  {(d.category_id && catName.get(d.category_id)) || 'Dokument'} · {formatDate(d.published_at)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a href={`/dokumenty/${d.id}/pobierz`} className="inline-flex min-h-[44px] items-center px-3 font-semibold text-navy underline">
                  Pobierz PDF
                </a>
                {d.requires_ack && !acked && (
                  <form action={acknowledgeDocument}>
                    <input type="hidden" name="document_id" value={d.id} />
                    <button type="submit" className="btn-danger">
                      Potwierdzam zapoznanie się
                    </button>
                  </form>
                )}
                {d.requires_ack && acked && (
                  <span className="chip bg-ok-light text-ok">✓ Potwierdzono {formatDate(acked)}</span>
                )}
              </div>
            </div>
          );
        })}
        {(docs ?? []).length === 0 && <p className="text-ink-muted">Brak opublikowanych dokumentów.</p>}
    </MemberShell>
  );
}
