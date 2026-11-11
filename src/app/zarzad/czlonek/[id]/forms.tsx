'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
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

const inp =
  'h-10 w-full rounded-md border border-line-strong bg-white px-2.5 text-[15px] disabled:border-transparent disabled:bg-page disabled:px-2.5 disabled:text-ink disabled:opacity-100 disabled:appearance-none';

function Cell({ id, label, children, wide = false }: { id: string; label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

export function EditMemberForm({ member, isSelf }: { member: Member; isSelf: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateMember, {});
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  const cancel = () => {
    formRef.current?.reset();
    setEditing(false);
  };

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="member_id" value={member.id} />
      <fieldset disabled={!editing} className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
        <legend className="sr-only">Dane członka</legend>
        <Cell id="e-login" label="Login">
          <input id="e-login" name="login" defaultValue={member.login} required inputMode="numeric" className={inp} />
        </Cell>
        <Cell id="e-no" label="Numer członkowski">
          <input id="e-no" name="member_no" defaultValue={member.member_no ?? ''} placeholder="do nadania" className={inp} />
        </Cell>
        <Cell id="e-first" label="Imię">
          <input id="e-first" name="first_name" defaultValue={member.first_name} required className={inp} />
        </Cell>
        <Cell id="e-last" label="Nazwisko">
          <input id="e-last" name="last_name" defaultValue={member.last_name} required className={inp} />
        </Cell>
        <Cell id="e-email" label="E-mail" wide>
          <input id="e-email" name="email" type="email" defaultValue={member.email ?? ''} className={inp} />
        </Cell>
        <Cell id="e-unit" label="Jednostka w CMKP">
          <input id="e-unit" name="unit" defaultValue={member.unit ?? ''} className={inp} />
        </Cell>
        <Cell id="e-position" label="Stanowisko">
          <input id="e-position" name="position" defaultValue={member.position ?? ''} className={inp} />
        </Cell>
        <Cell id="e-dm" label="Forma opłaty składek">
          <select id="e-dm" name="dues_method" defaultValue={member.dues_method ?? ''} className={inp}>
            <option value="">– nie wybrano –</option>
            <option value="pracodawca">Pracodawca</option>
            <option value="przelew">Przelew</option>
          </select>
        </Cell>
        <Cell id="e-joined" label="Data przyjęcia">
          <input id="e-joined" name="joined_at" type="date" defaultValue={member.joined_at} required className={inp} />
        </Cell>
        <Cell id="e-card" label="Legitymacja ważna do">
          <input id="e-card" name="card_valid_until" type="date" defaultValue={member.card_valid_until ?? ''} className={inp} />
        </Cell>
        <div className="col-span-2 flex items-end sm:col-span-1">
          <label className="flex min-h-10 items-center gap-2.5 text-[15px]">
            <input type="checkbox" name="is_board" defaultChecked={member.is_board} disabled={isSelf || !editing} className="h-5 w-5" />
            <span>Członek zarządu{isSelf && editing ? ' (nie możesz zmienić własnej roli)' : ''}</span>
          </label>
          {isSelf && <input type="hidden" name="is_board" value="on" />}
        </div>
      </fieldset>
      {editing && (
        <p className="text-sm text-ink-muted">
          Puste pole ważności = legitymacja do końca bieżącego roku. Nowy login działa od razu, hasło się nie zmienia.
        </p>
      )}
      <Message state={state} />
      <div className="flex flex-wrap gap-2">
        {editing ? (
          <>
            <button key="save" type="submit" className="btn-primary" disabled={pending}>
              {pending ? 'Zapisywanie…' : 'Zapisz zmiany'}
            </button>
            <button key="cancel" type="button" className="btn-secondary" onClick={cancel} disabled={pending}>
              Anuluj
            </button>
          </>
        ) : (
          <button
            key="edit"
            type="button"
            className="btn-secondary"
            onClick={(e) => {
              e.preventDefault();
              setEditing(true);
              // fokus na pierwsze pole po odblokowaniu
              setTimeout(() => formRef.current?.querySelector<HTMLInputElement>('#e-login')?.focus(), 0);
            }}
          >
            Edytuj
          </button>
        )}
      </div>
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
