'use client';

import { useActionState } from 'react';
import { toggleRegistration, type RegistrationState } from './actions';

export function RegistrationButton({
  eventId,
  registered,
  canRegister,
}: {
  eventId: string;
  registered: boolean;
  canRegister: boolean;
}) {
  const [state, action, pending] = useActionState<RegistrationState, FormData>(toggleRegistration, {});

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="register" value={registered ? '0' : '1'} />
      {registered && <span className="chip bg-ok-light text-ok">Jesteś zapisana/zapisany</span>}
      {registered ? (
        <button type="submit" className="btn-secondary" disabled={pending}>
          {pending ? '…' : 'Wypisz się'}
        </button>
      ) : canRegister ? (
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? '…' : 'Zapisz się'}
        </button>
      ) : (
        <span className="text-sm font-semibold text-ink-muted">Zapisy zamknięte</span>
      )}
      {state.error && (
        <span role="alert" className="text-sm font-semibold text-[#9B1C1C]">
          {state.error}
        </span>
      )}
    </form>
  );
}
