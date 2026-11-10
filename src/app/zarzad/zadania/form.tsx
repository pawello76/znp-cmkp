'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addTask, type TaskFormState } from './actions';

type Person = { id: string; label: string; board: boolean };

export function AddTaskForm({ people }: { people: Person[] }) {
  const [state, action, pending] = useActionState<TaskFormState, FormData>(addTask, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-[2_1_280px] flex-col gap-1.5">
          <label htmlFor="t-title" className="label">
            Zadanie
          </label>
          <input id="t-title" name="title" required placeholder="Co trzeba zrobić?" className="field" />
        </div>
        <div className="flex flex-[1_1_240px] flex-col gap-1.5">
          <label htmlFor="t-who" className="label">
            Przypisz do
          </label>
          <select id="t-who" name="assignee_id" required className="field" defaultValue="">
            <option value="" disabled>
              Wybierz osobę…
            </option>
            <optgroup label="Zarząd">
              {people.filter((p) => p.board).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Członkowie">
              {people.filter((p) => !p.board).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="flex flex-[1_1_160px] flex-col gap-1.5">
          <label htmlFor="t-due" className="label">
            Termin
          </label>
          <input id="t-due" name="due_on" type="date" className="field" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="t-desc" className="label">
          Szczegóły (opcjonalnie)
        </label>
        <textarea id="t-desc" name="description" rows={2} className="rounded-lg border border-line-strong px-3 py-2.5" />
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
        {pending ? 'Zapisywanie…' : 'Przypisz zadanie'}
      </button>
    </form>
  );
}
