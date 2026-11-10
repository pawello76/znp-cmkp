'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addEvent, type EventFormState } from './actions';

export function AddEventForm() {
  const [state, action, pending] = useActionState<EventFormState, FormData>(addEvent, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-[2_1_280px] flex-col gap-1.5">
          <label htmlFor="ev-title" className="label">
            Nazwa
          </label>
          <input id="ev-title" name="title" required maxLength={200} className="field" />
        </div>
        <div className="flex flex-[1_1_200px] flex-col gap-1.5">
          <label htmlFor="ev-start" className="label">
            Początek
          </label>
          <input id="ev-start" name="starts_at" type="datetime-local" required className="field" />
        </div>
        <div className="flex flex-[1_1_200px] flex-col gap-1.5">
          <label htmlFor="ev-end" className="label">
            Koniec (opcjonalnie)
          </label>
          <input id="ev-end" name="ends_at" type="datetime-local" className="field" />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-[2_1_280px] flex-col gap-1.5">
          <label htmlFor="ev-place" className="label">
            Miejsce
          </label>
          <input id="ev-place" name="place" className="field" />
        </div>
        <div className="flex flex-[1_1_140px] flex-col gap-1.5">
          <label htmlFor="ev-cap" className="label">
            Limit miejsc
          </label>
          <input id="ev-cap" name="capacity" type="number" min={1} placeholder="bez limitu" className="field" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ev-desc" className="label">
          Opis
        </label>
        <textarea id="ev-desc" name="description" rows={3} className="rounded-lg border border-line-strong px-3 py-2.5" />
      </div>
      {state.error && (
        <p role="alert" className="font-semibold text-[#9B1C1C]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="font-semibold text-ok">
          {state.ok}
        </p>
      )}
      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? 'Zapisywanie…' : 'Dodaj wydarzenie'}
      </button>
    </form>
  );
}
