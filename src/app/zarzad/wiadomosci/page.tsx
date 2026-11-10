import Link from 'next/link';
import { BoardShell } from '@/components/shell';
import { formatDateTime } from '@/lib/format';
import { requireBoard } from '@/lib/session';

const FOLDERS = [
  { id: 'aktualne', label: 'Aktualne', hint: 'Nowe wiadomości i wątki, w których członek dopisał odpowiedź.' },
  { id: 'przeczytane', label: 'Przeczytane', hint: 'Otwarte lub odpowiedziane wątki.' },
  { id: 'archiwalne', label: 'Archiwalne', hint: 'Sprawy zamknięte. Można je przywrócić.' },
] as const;
type Folder = (typeof FOLDERS)[number]['id'];

export default async function BoardMessagesPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const { supabase, member: me } = await requireBoard();
  const { folder: raw } = await searchParams;
  const folder: Folder = (FOLDERS.find((f) => f.id === raw)?.id ?? 'aktualne') as Folder;

  const [{ data: threads }, { data: members }, { data: roles }] = await Promise.all([
    supabase.from('message_threads').select('*').order('last_message_at', { ascending: false }),
    supabase.from('members').select('id, member_no, first_name, last_name'),
    supabase.from('board_roles').select('id, name'),
  ]);
  const who = new Map((members ?? []).map((m) => [m.id, `${m.first_name} ${m.last_name}${m.member_no ? ` (${m.member_no})` : ''}`]));
  const roleName = new Map((roles ?? []).map((r) => [r.id, r.name]));
  const counts = Object.fromEntries(FOLDERS.map((f) => [f.id, (threads ?? []).filter((t) => t.board_folder === f.id).length]));
  const list = (threads ?? []).filter((t) => t.board_folder === folder);

  return (
    <BoardShell member={me} current="/zarzad/wiadomosci">
        <h1 className="text-[28px] font-bold">Wiadomości od członków</h1>
        <nav aria-label="Foldery" className="flex flex-wrap gap-2">
          {FOLDERS.map((f) => (
            <Link
              key={f.id}
              href={`/zarzad/wiadomosci?folder=${f.id}`}
              aria-current={f.id === folder ? 'page' : undefined}
              className={
                f.id === folder
                  ? 'inline-flex min-h-[44px] items-center rounded-lg border-2 border-navy bg-navy-light px-4 font-bold text-navy'
                  : 'inline-flex min-h-[44px] items-center rounded-lg border border-line-strong bg-white px-4'
              }
            >
              {f.label} ({counts[f.id]})
            </Link>
          ))}
        </nav>
        <p className="text-sm text-ink-muted">{FOLDERS.find((f) => f.id === folder)!.hint}</p>

        {list.map((t) => (
          <Link
            key={t.id}
            href={`/zarzad/wiadomosci/${t.id}`}
            className="card flex flex-wrap items-center justify-between gap-3 hover:border-navy"
          >
            <span className="flex items-center gap-3">
              {folder === 'aktualne' && <span aria-label="nowa" className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />}
              <span className="flex flex-col">
                <span className="font-bold text-navy underline">{t.subject}</span>
                <span className="text-sm text-ink-muted">
                  {who.get(t.member_id) ?? 'Członek'} → {t.to_board_role_id ? roleName.get(t.to_board_role_id) : 'cały zarząd'} ·{' '}
                  {formatDateTime(t.last_message_at)}
                </span>
              </span>
            </span>
          </Link>
        ))}
        {list.length === 0 && <p className="text-ink-muted">Brak wiadomości w tym folderze.</p>}
    </BoardShell>
  );
}
