'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addNews, type NewsFormState } from './actions';

export function AddNewsForm() {
  const [state, action, pending] = useActionState<NewsFormState, FormData>(addNews, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="n-title" className="label">
          Tytuł
        </label>
        <input id="n-title" name="title" required maxLength={200} className="field" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="n-lead" className="label">
          Zajawka (widoczna na liście)
        </label>
        <textarea id="n-lead" name="lead" rows={2} maxLength={500} className="rounded-lg border border-line-strong px-3 py-2.5" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="n-body" className="label">
          Pełna treść
        </label>
        <textarea id="n-body" name="body" rows={6} className="rounded-lg border border-line-strong px-3 py-2.5" />
      </div>
      <label className="flex min-h-[44px] items-center gap-2.5">
        <input type="checkbox" name="publish" defaultChecked className="h-5 w-5" />
        <span>Opublikuj od razu (odznacz, aby zapisać szkic)</span>
      </label>
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
        {pending ? 'Zapisywanie…' : 'Dodaj aktualność'}
      </button>
    </form>
  );
}
