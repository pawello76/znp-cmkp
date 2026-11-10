'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addBenefit, updateBenefit, type BenefitFormState } from './actions';

function Msg({ s }: { s: BenefitFormState }) {
  if (s.error) return <p role="alert" className="font-semibold text-[#9B1C1C]">{s.error}</p>;
  if (s.ok) return <p role="status" className="font-semibold text-ok">{s.ok}</p>;
  return null;
}

type Benefit = { id: string; name: string; category: string | null; description: string | null };

function Fields({ prefix, b }: { prefix: string; b?: Benefit }) {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-[2_1_240px] flex-col gap-1.5">
          <label htmlFor={`${prefix}-name`} className="label">
            Nazwa
          </label>
          <input id={`${prefix}-name`} name="name" required defaultValue={b?.name} className="field" />
        </div>
        <div className="flex flex-[1_1_200px] flex-col gap-1.5">
          <label htmlFor={`${prefix}-cat`} className="label">
            Kategoria
          </label>
          <input id={`${prefix}-cat`} name="category" defaultValue={b?.category ?? ''} placeholder="np. Sport i rekreacja" className="field" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${prefix}-desc`} className="label">
          Opis dla członków
        </label>
        <textarea id={`${prefix}-desc`} name="description" rows={3} defaultValue={b?.description ?? ''} className="rounded-lg border border-line-strong px-3 py-2.5" />
      </div>
    </>
  );
}

export function AddBenefitForm() {
  const [state, action, pending] = useActionState<BenefitFormState, FormData>(addBenefit, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <Fields prefix="new" />
      <Msg s={state} />
      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? 'Zapisywanie…' : 'Dodaj benefit'}
      </button>
    </form>
  );
}

export function EditBenefitForm({ benefit }: { benefit: Benefit }) {
  const [state, action, pending] = useActionState<BenefitFormState, FormData>(updateBenefit, {});
  return (
    <form action={action} className="flex flex-col gap-3 pt-2">
      <input type="hidden" name="benefit_id" value={benefit.id} />
      <Fields prefix={`e-${benefit.id}`} b={benefit} />
      <Msg s={state} />
      <button type="submit" className="btn-secondary self-start" disabled={pending}>
        {pending ? 'Zapisywanie…' : 'Zapisz zmiany'}
      </button>
    </form>
  );
}
