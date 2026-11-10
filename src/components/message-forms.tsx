'use client';

import { useActionState, useEffect, useRef } from 'react';
import { replyInThread, startThread, type MessageState } from '@/app/kontakt/actions';

type ReplyAction = (prev: MessageState, formData: FormData) => Promise<MessageState>;

/** Odpowiedź w wątku – używana przez członka i zarząd (każdy z własną akcją serwera). */
export function ReplyForm({ threadId, action = replyInThread, label = 'Dopisz wiadomość' }: { threadId: string; action?: ReplyAction; label?: string }) {
  const [state, formAction, pending] = useActionState<MessageState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current && !state.error) ref.current?.reset();
    sent.current = false;
  }, [state]);

  return (
    <form
      ref={ref}
      action={(fd) => {
        sent.current = true;
        formAction(fd);
      }}
      className="flex flex-col gap-2.5"
    >
      <input type="hidden" name="thread_id" value={threadId} />
      <label htmlFor={`reply-${threadId}`} className="label">
        {label}
      </label>
      <textarea
        id={`reply-${threadId}`}
        name="body"
        rows={4}
        required
        maxLength={5000}
        className="rounded-lg border border-line-strong px-3 py-2.5"
      />
      {state.error && (
        <p role="alert" className="font-semibold text-[#9B1C1C]">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? 'Wysyłanie…' : 'Wyślij'}
      </button>
    </form>
  );
}

export function NewThreadForm({ roles }: { roles: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<MessageState, FormData>(startThread, {});

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="to" className="label">
          Do kogo
        </label>
        <select id="to" name="to_board_role_id" className="field">
          <option value="">Cały zarząd</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="subject" className="label">
          Temat
        </label>
        <input id="subject" name="subject" required maxLength={200} className="field" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="body" className="label">
          Wiadomość
        </label>
        <textarea id="body" name="body" rows={5} required maxLength={5000} className="rounded-lg border border-line-strong px-3 py-2.5" />
      </div>
      {state.error && (
        <p role="alert" className="font-semibold text-[#9B1C1C]">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? 'Wysyłanie…' : 'Wyślij'}
      </button>
      <p className="text-sm text-ink-muted">Odpowiedź zarządu pojawi się w „Moich wiadomościach”, oznaczona jako nowa.</p>
    </form>
  );
}
