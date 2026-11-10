'use client';

import { useActionState } from 'react';
import type { Member } from '@/lib/session';
import { addPayment, updateMember, type FormState } from './actions';

function Message({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="font-semibold text-[#9B1C1C]">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="font-semibold text-ok">
        {state.ok}
      </p>
    );
  return null;
}

function Field({
  id,
  label,
  children,
  grow = '1_1_200px',
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  grow?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5" style={{ flex: grow.replace(/_/g, ' ') }}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
    </div>
  );
}

export function EditMemberForm({ member, isSelf }: { member: Member; isSelf: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateMember, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="member_id" value={member.id} />
      <div className="flex flex-wrap gap-3">
        <Field id="e-first" label="Imię">
          <input id="e-first" name="first_name" defaultValue={member.first_name} required className="field" />
        </Field>
        <Field id="e-last" label="Nazwisko">
          <input id="e-last" name="last_name" defaultValue={member.last_name} required className="field" />
        </Field>
        <Field id="e-email" label="E-mail" grow="1_1_240px">
          <input id="e-email" name="email" type="email" defaultValue={member.email ?? ''} className="field" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-3">
        <Field id="e-unit" label="Jednostka w CMKP">
          <input id="e-unit" name="unit" defaultValue={member.unit ?? ''} className="field" />
        </Field>
        <Field id="e-position" label="Stanowisko">
          <input id="e-position" name="position" defaultValue={member.position ?? ''} className="field" />
        </Field>
        <Field id="e-joined" label="Data przyjęcia" grow="1_1_160px">
          <input id="e-joined" name="joined_at" type="date" defaultValue={member.joined_at} required className="field" />
        </Field>
        <Field id="e-card" label="Legitymacja ważna do" grow="1_1_160px">
          <input id="e-card" name="card_valid_until" type="date" defaultValue={member.card_valid_until ?? ''} className="field" />
        </Field>
      </div>
      <p className="text-sm text-ink-muted">Puste pole ważności = legitymacja ważna do końca bieżącego roku.</p>
      <label className="flex min-h-[44px] items-center gap-2.5">
        <input type="checkbox" name="is_board" defaultChecked={member.is_board} disabled={isSelf} className="h-5 w-5" />
        <span>Członek zarządu{isSelf ? ' (nie możesz zmienić własnej roli)' : ''}</span>
        {isSelf && <input type="hidden" name="is_board" value="on" />}
      </label>
      <Message state={state} />
      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? 'Zapisywanie…' : 'Zapisz zmiany'}
      </button>
    </form>
  );
}

export function AddPaymentForm({ memberId, defaultMonth, today }: { memberId: string; defaultMonth: string; today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addPayment, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="member_id" value={memberId} />
      <div className="flex flex-wrap items-end gap-3">
        <Field id="p-date" label="Data wpłaty" grow="1_1_150px">
          <input id="p-date" name="paid_on" type="date" defaultValue={today} required className="field" />
        </Field>
        <Field id="p-from" label="Za okres od" grow="1_1_150px">
          <input id="p-from" name="period_from" type="month" defaultValue={defaultMonth} required className="field" />
        </Field>
        <Field id="p-to" label="do" grow="1_1_150px">
          <input id="p-to" name="period_to" type="month" defaultValue={defaultMonth} required className="field" />
        </Field>
        <Field id="p-amount" label="Kwota (zł)" grow="1_1_120px">
          <input id="p-amount" name="amount" inputMode="decimal" placeholder="35,00" required className="field" />
        </Field>
        <Field id="p-note" label="Uwagi" grow="2_1_200px">
          <input id="p-note" name="note" className="field" />
        </Field>
      </div>
      <Message state={state} />
      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? 'Zapisywanie…' : 'Dodaj wpłatę'}
      </button>
    </form>
  );
}
