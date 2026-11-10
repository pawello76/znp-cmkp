import { formatDateTime } from '@/lib/format';

export type ThreadMessage = { id: string; body: string; created_at: string; author_id: string };

/** Wiadomości wątku: strona „moja” po prawej, druga strona po lewej. */
export function ThreadView({
  messages,
  mineId,
  nameOf,
}: {
  messages: ThreadMessage[];
  mineId: (authorId: string) => boolean;
  nameOf: (authorId: string) => string;
}) {
  return (
    <ol className="flex flex-col gap-2.5">
      {messages.map((m) => {
        const mine = mineId(m.author_id);
        return (
          <li
            key={m.id}
            className={`flex flex-col gap-1 rounded-[10px] px-3.5 py-3 ${
              mine ? 'ml-12 bg-navy-light' : 'mr-12 border border-line bg-page'
            }`}
          >
            <span className="text-[13px] font-semibold text-ink-muted">
              {nameOf(m.author_id)} · {formatDateTime(m.created_at)}
            </span>
            <span className="whitespace-pre-line leading-relaxed">{m.body}</span>
          </li>
        );
      })}
    </ol>
  );
}
