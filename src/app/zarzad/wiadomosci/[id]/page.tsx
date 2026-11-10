import { notFound } from 'next/navigation';
import { BoardShell } from '@/components/shell';
import { ReplyForm } from '@/components/message-forms';
import { ThreadView } from '@/components/thread-view';
import { requireBoard } from '@/lib/session';
import { boardReply, setFolder } from '../actions';

export default async function BoardThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, member: me } = await requireBoard();

  const { data: thread } = await supabase.from('message_threads').select('*').eq('id', id).maybeSingle();
  if (!thread) notFound();

  // Otwarcie nowej wiadomości przenosi ją do „Przeczytane”
  if (thread.board_folder === 'aktualne') {
    await supabase.from('message_threads').update({ board_folder: 'przeczytane' }).eq('id', id);
  }

  const [{ data: messages }, { data: members }] = await Promise.all([
    supabase.from('messages').select('id, body, created_at, author_id').eq('thread_id', id).order('created_at'),
    supabase.from('members').select('id, member_no, first_name, last_name, is_board'),
  ]);
  const byId = new Map((members ?? []).map((m) => [m.id, m]));
  const author = byId.get(thread.member_id);
  const archived = thread.board_folder === 'archiwalne';

  return (
    <BoardShell member={me} current="/zarzad/wiadomosci">
        <a href="/zarzad/wiadomosci" className="self-start font-semibold text-navy">
          ← Wróć do wiadomości
        </a>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">{thread.subject}</h1>
            <span className="text-ink-muted">
              od: {author ? `${author.first_name} ${author.last_name}${author.member_no ? ` (${author.member_no})` : ''}` : 'członek'}
            </span>
          </div>
          <form action={setFolder}>
            <input type="hidden" name="thread_id" value={id} />
            <input type="hidden" name="folder" value={archived ? 'przeczytane' : 'archiwalne'} />
            <button type="submit" className="btn-secondary">
              {archived ? 'Przywróć z archiwum' : 'Archiwizuj'}
            </button>
          </form>
        </div>
        <ThreadView
          messages={messages ?? []}
          mineId={(a) => byId.get(a)?.is_board === true && a !== thread.member_id}
          nameOf={(a) => {
            const m = byId.get(a);
            if (!m) return 'Członek';
            return a === me.id ? 'Ty (zarząd)' : `${m.first_name} ${m.last_name}`;
          }}
        />
        <div className="card flex flex-col gap-2">
          <ReplyForm threadId={id} action={boardReply} label="Odpowiedź zarządu" />
          <p className="text-sm text-ink-muted">Członek zobaczy odpowiedź w zakładce Kontakt, oznaczoną jako nowa.</p>
        </div>
    </BoardShell>
  );
}
