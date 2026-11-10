-- ZNP w CMKP – funkcje pomocnicze, wyzwalacze i reguły dostępu (RLS)

-- 1. Kim jest zalogowana osoba ----------------------------------------------
create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members where id = auth.uid() and status = 'aktywny');
$$;

create or replace function public.is_board()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members where id = auth.uid() and status = 'aktywny' and is_board);
$$;

-- 2. Wyzwalacze ogólne -------------------------------------------------------
-- updated_at / updated_by
create or replace function public.set_updated()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

-- Członek (nie zarząd) może zmienić tylko kolumny wymienione w argumentach wyzwalacza.
-- Zmiany robione przez funkcje SECURITY DEFINER i klucz serwisowy (inny current_user) przechodzą.
create or replace function public.guard_non_board_update()
returns trigger language plpgsql set search_path = '' as $$
declare
  k text;
  o jsonb := to_jsonb(old);
  n jsonb := to_jsonb(new);
begin
  if current_user not in ('authenticated', 'anon') or public.is_board() then
    return new;
  end if;
  foreach k in array tg_argv || array['updated_at', 'updated_by'] loop
    o := o - k;
    n := n - k;
  end loop;
  if o is distinct from n then
    raise exception 'Brak uprawnień do zmiany tych danych' using errcode = '42501';
  end if;
  return new;
end $$;

-- Dziennik zdarzeń
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (actor_id, action, table_name, record_id, details)
  values (
    auth.uid(), tg_op, tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

-- updated_at na tabelach edytowanych przez zarząd
do $$
declare t text;
begin
  foreach t in array array['members','declarations','bank_imports','dues_payments','news','documents',
                           'polls','events','tasks','benefits','benefit_requests','message_threads'] loop
    execute format('create trigger set_updated before update on public.%I for each row execute function public.set_updated()', t);
  end loop;
  foreach t in array array['members','declarations','bank_imports','dues_payments','news','documents',
                           'polls','events','tasks','benefits','benefit_requests'] loop
    execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.audit_row()', t);
  end loop;
end $$;

-- Ograniczenia kolumn dla zwykłego członka
create trigger guard_update before update on public.members
  for each row execute function public.guard_non_board_update('photo_path');
create trigger guard_update before update on public.tasks
  for each row execute function public.guard_non_board_update('status', 'done_at');
create trigger guard_update before update on public.message_threads
  for each row execute function public.guard_non_board_update('member_last_read_at');

-- Zadanie: data wykonania ustawia się sama
create or replace function public.task_done_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'wykonane' and old.status is distinct from 'wykonane' then new.done_at := now(); end if;
  if new.status = 'w_toku' then new.done_at := null; end if;
  return new;
end $$;
create trigger task_done_at before update on public.tasks for each row execute function public.task_done_at();

-- Nowa wiadomość: aktualizuje wątek; wiadomość członka wraca wątek do „Aktualne”
create or replace function public.message_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.message_threads t
     set last_message_at = new.created_at,
         board_folder = case when new.author_id = t.member_id then 'aktualne'::public.board_folder else t.board_folder end,
         member_last_read_at = case when new.author_id = t.member_id then new.created_at else t.member_last_read_at end
   where t.id = new.thread_id;
  return new;
end $$;
create trigger message_after_insert after insert on public.messages for each row execute function public.message_after_insert();

-- Głosowanie: liczba uprawnionych zamrażana przy starcie
create or replace function public.poll_freeze_eligible()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'trwa' and (tg_op = 'INSERT' or old.status = 'szkic') then
    new.eligible_count := (select count(*) from public.members where status = 'aktywny');
  end if;
  if tg_op = 'UPDATE' and old.status <> 'szkic'
     and (new.mode, new.quorum_pct, new.majority, new.starts_at) is distinct from
         (old.mode, old.quorum_pct, old.majority, old.starts_at) then
    raise exception 'Nie można zmienić zasad głosowania po jego rozpoczęciu';
  end if;
  return new;
end $$;
create trigger poll_freeze_eligible before insert or update on public.polls for each row execute function public.poll_freeze_eligible();

-- Wydarzenie: limit miejsc i otwarte zapisy
create or replace function public.event_registration_check()
returns trigger language plpgsql security definer set search_path = '' as $$
declare e public.events;
begin
  select * into e from public.events where id = new.event_id for update;
  if not found or not e.is_published or not e.registration_open or e.starts_at < now() then
    raise exception 'Zapisy na to wydarzenie są zamknięte';
  end if;
  if e.capacity is not null
     and (select count(*) from public.event_registrations where event_id = new.event_id) >= e.capacity then
    raise exception 'Brak wolnych miejsc';
  end if;
  return new;
end $$;
create trigger event_registration_check before insert on public.event_registrations
  for each row execute function public.event_registration_check();

-- 3. Funkcje dla aplikacji (RPC) ---------------------------------------------
-- Oddanie głosu: jedyna droga zapisu do poll_ballots i poll_votes
create or replace function public.cast_vote(p_poll uuid, p_option uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.polls;
begin
  if not public.is_active_member() then
    raise exception 'Brak uprawnień' using errcode = '42501';
  end if;
  select * into v from public.polls where id = p_poll for update;
  if not found or v.status <> 'trwa' or now() < v.starts_at or now() > v.ends_at then
    raise exception 'Głosowanie nie trwa';
  end if;
  if not exists (select 1 from public.poll_options where id = p_option and poll_id = p_poll) then
    raise exception 'Nieprawidłowa odpowiedź';
  end if;
  if exists (select 1 from public.poll_ballots where poll_id = p_poll and member_id = auth.uid()) then
    raise exception 'Głos został już oddany';
  end if;
  insert into public.poll_ballots (poll_id, member_id) values (p_poll, auth.uid());
  insert into public.poll_votes (poll_id, option_id, member_id)
  values (p_poll, p_option, case when v.mode = 'jawne' then auth.uid() end);
end $$;

-- Frekwencja (widoczna dla wszystkich członków w trakcie)
create or replace function public.poll_turnout(p_poll uuid)
returns table (votes bigint, eligible int)
language sql stable security definer set search_path = '' as $$
  select (select count(*) from public.poll_ballots b where b.poll_id = p.id), p.eligible_count
    from public.polls p
   where p.id = p_poll and p.status <> 'szkic' and public.is_active_member();
$$;

-- Wyniki zbiorcze: po zakończeniu; w jawnym zarząd widzi też w trakcie
create or replace function public.poll_results(p_poll uuid)
returns table (option_id uuid, label text, sort_order int, votes bigint)
language plpgsql stable security definer set search_path = '' as $$
declare v public.polls;
begin
  select * into v from public.polls where id = p_poll;
  if not found or v.status = 'szkic' or not public.is_active_member() then return; end if;
  if not (v.status = 'zakonczone' or now() > v.ends_at or (v.mode = 'jawne' and public.is_board())) then return; end if;
  return query
    select o.id, o.label, o.sort_order, count(pv.id)
      from public.poll_options o
      left join public.poll_votes pv on pv.option_id = o.id
     where o.poll_id = p_poll
     group by o.id, o.label, o.sort_order
     order by o.sort_order;
end $$;

-- Imienna lista głosów: tylko zarząd, tylko głosowania jawne
create or replace function public.poll_named_votes(p_poll uuid)
returns table (member_no text, first_name text, last_name text, option_label text)
language sql stable security definer set search_path = '' as $$
  select m.member_no, m.first_name, m.last_name, o.label
    from public.poll_votes pv
    join public.polls p on p.id = pv.poll_id and p.mode = 'jawne'
    join public.members m on m.id = pv.member_id
    join public.poll_options o on o.id = pv.option_id
   where pv.poll_id = p_poll and public.is_board()
   order by m.last_name, m.first_name;
$$;

-- Liczba zapisanych na wydarzenia
create or replace function public.event_counts()
returns table (event_id uuid, registered bigint)
language sql stable security definer set search_path = '' as $$
  select r.event_id, count(*) from public.event_registrations r
   where public.is_active_member() group by r.event_id;
$$;

-- Lista zarządu do zakładki Kontakt
create or replace function public.board_contacts()
returns table (member_id uuid, first_name text, last_name text, roles text[])
language sql stable security definer set search_path = '' as $$
  select m.id, m.first_name, m.last_name,
         coalesce(array_agg(r.name order by r.sort_order) filter (where r.id is not null), '{}')
    from public.members m
    left join public.member_board_roles mbr on mbr.member_id = m.id
    left join public.board_roles r on r.id = mbr.board_role_id
   where m.is_board and m.status = 'aktywny' and public.is_active_member()
   group by m.id, m.first_name, m.last_name
   order by m.last_name;
$$;

-- Ostatnia wizyta (pulpit „od ostatniego logowania”); zwraca poprzednią wartość
create or replace function public.touch_last_seen()
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare prev timestamptz;
begin
  select last_seen_at into prev from public.members where id = auth.uid();
  update public.members set last_seen_at = now() where id = auth.uid();
  return prev;
end $$;

-- Hasło tymczasowe zmienione przez członka
create or replace function public.mark_password_changed()
returns void language sql security definer set search_path = '' as $$
  update public.members set must_change_password = false where id = auth.uid();
$$;

-- Status składek liczony z historii wpłat (RLS członków działa przez security_invoker)
create view public.member_dues_status with (security_invoker = true) as
  select m.id as member_id,
         m.member_no,
         max(p.period_to) as paid_until,
         greatest(0,
           (extract(year from current_date) * 12 + extract(month from current_date))
           - coalesce(extract(year from max(p.period_to)) * 12 + extract(month from max(p.period_to)),
                      extract(year from m.joined_at) * 12 + extract(month from m.joined_at) - 1)
         )::int as months_due
    from public.members m
    left join public.dues_payments p on p.member_id = m.id
   group by m.id, m.member_no, m.joined_at;

-- Uprawnienia do funkcji: tylko zalogowani
do $$
declare f text;
begin
  foreach f in array array[
    'is_active_member()', 'is_board()', 'cast_vote(uuid, uuid)', 'poll_turnout(uuid)', 'poll_results(uuid)',
    'poll_named_votes(uuid)', 'event_counts()', 'board_contacts()', 'touch_last_seen()', 'mark_password_changed()'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  foreach f in array array[
    'set_updated()', 'guard_non_board_update()', 'audit_row()', 'task_done_at()', 'message_after_insert()',
    'poll_freeze_eligible()', 'event_registration_check()'] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;

-- 4. Reguły dostępu (RLS) -----------------------------------------------------
-- Skróty: (select public.is_board()) i (select auth.uid()) liczone raz na zapytanie.

-- members
create policy members_select on public.members for select to authenticated
  using (id = (select auth.uid()) or (select public.is_board()));
create policy members_update on public.members for update to authenticated
  using (id = (select auth.uid()) or (select public.is_board()))
  with check (id = (select auth.uid()) or (select public.is_board()));
-- tworzenie kont: wyłącznie serwer (klucz serwisowy), bo wymaga konta w Auth

-- board_roles, member_board_roles
create policy board_roles_select on public.board_roles for select to authenticated
  using ((select public.is_active_member()));
create policy board_roles_write on public.board_roles for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));
create policy member_board_roles_select on public.member_board_roles for select to authenticated
  using ((select public.is_active_member()));
create policy member_board_roles_write on public.member_board_roles for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));

-- declarations (składanie: przez serwer z limitem prób)
create policy declarations_board on public.declarations for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));

-- dues_rates
create policy dues_rates_select on public.dues_rates for select to authenticated
  using ((select public.is_active_member()));
create policy dues_rates_write on public.dues_rates for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));

-- dues_payments
create policy dues_payments_select on public.dues_payments for select to authenticated
  using (member_id = (select auth.uid()) or (select public.is_board()));
create policy dues_payments_write on public.dues_payments for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));

-- bank_imports, bank_import_rows
create policy bank_imports_board on public.bank_imports for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));
create policy bank_import_rows_board on public.bank_import_rows for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));

-- news, news_reads
create policy news_select on public.news for select to authenticated
  using ((select public.is_board()) or ((select public.is_active_member()) and is_published and published_at <= now()));
create policy news_write on public.news for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));
create policy news_reads_select on public.news_reads for select to authenticated
  using (member_id = (select auth.uid()) or (select public.is_board()));
create policy news_reads_insert on public.news_reads for insert to authenticated
  with check (member_id = (select auth.uid()) and (select public.is_active_member()));

-- document_categories, documents, document_acks
create policy document_categories_select on public.document_categories for select to authenticated
  using ((select public.is_active_member()));
create policy document_categories_write on public.document_categories for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));
create policy documents_select on public.documents for select to authenticated
  using ((select public.is_board()) or ((select public.is_active_member()) and is_published and published_at <= now()));
create policy documents_write on public.documents for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));
create policy document_acks_select on public.document_acks for select to authenticated
  using (member_id = (select auth.uid()) or (select public.is_board()));
create policy document_acks_insert on public.document_acks for insert to authenticated
  with check (
    member_id = (select auth.uid()) and (select public.is_active_member())
    and exists (select 1 from public.documents d
                 where d.id = document_id and d.requires_ack and d.is_published and d.published_at <= now()));

-- polls, poll_options, poll_ballots, poll_votes
create policy polls_select on public.polls for select to authenticated
  using ((select public.is_board()) or ((select public.is_active_member()) and status <> 'szkic'));
create policy polls_write on public.polls for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));
create policy poll_options_select on public.poll_options for select to authenticated
  using (exists (select 1 from public.polls p where p.id = poll_id));  -- dziedziczy regułę polls
create policy poll_options_write on public.poll_options for all to authenticated
  using ((select public.is_board()) and exists (select 1 from public.polls p where p.id = poll_id and p.status = 'szkic'))
  with check ((select public.is_board()) and exists (select 1 from public.polls p where p.id = poll_id and p.status = 'szkic'));
create policy poll_ballots_select on public.poll_ballots for select to authenticated
  using (member_id = (select auth.uid()) or (select public.is_board()));
-- poll_ballots i poll_votes: brak polityk zapisu (tylko cast_vote);
-- poll_votes: brak polityki odczytu – wyniki wyłącznie przez poll_results / poll_named_votes

-- events, event_registrations
create policy events_select on public.events for select to authenticated
  using ((select public.is_board()) or ((select public.is_active_member()) and is_published));
create policy events_write on public.events for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));
create policy event_registrations_select on public.event_registrations for select to authenticated
  using (member_id = (select auth.uid()) or (select public.is_board()));
create policy event_registrations_insert on public.event_registrations for insert to authenticated
  with check (member_id = (select auth.uid()) and (select public.is_active_member()));
create policy event_registrations_delete on public.event_registrations for delete to authenticated
  using (member_id = (select auth.uid()) or (select public.is_board()));

-- tasks
create policy tasks_select on public.tasks for select to authenticated
  using (assignee_id = (select auth.uid()) or (select public.is_board()));
create policy tasks_update on public.tasks for update to authenticated
  using (assignee_id = (select auth.uid()) or (select public.is_board()))
  with check (assignee_id = (select auth.uid()) or (select public.is_board()));
create policy tasks_insert on public.tasks for insert to authenticated
  with check ((select public.is_board()));
create policy tasks_delete on public.tasks for delete to authenticated
  using ((select public.is_board()));

-- benefits, benefit_requests
create policy benefits_select on public.benefits for select to authenticated
  using ((select public.is_board()) or ((select public.is_active_member()) and is_visible));
create policy benefits_write on public.benefits for all to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));
create policy benefit_requests_select on public.benefit_requests for select to authenticated
  using (member_id = (select auth.uid()) or (select public.is_board()));
create policy benefit_requests_insert on public.benefit_requests for insert to authenticated
  with check (
    member_id = (select auth.uid()) and status = 'zgloszony' and (select public.is_active_member())
    and exists (select 1 from public.benefits b where b.id = benefit_id and b.is_visible));
create policy benefit_requests_board on public.benefit_requests for update to authenticated
  using ((select public.is_board())) with check ((select public.is_board()));

-- message_threads, messages
create policy threads_select on public.message_threads for select to authenticated
  using (member_id = (select auth.uid()) or (select public.is_board()));
create policy threads_insert on public.message_threads for insert to authenticated
  with check (member_id = (select auth.uid()) and (select public.is_active_member()));
create policy threads_update on public.message_threads for update to authenticated
  using (member_id = (select auth.uid()) or (select public.is_board()))
  with check (member_id = (select auth.uid()) or (select public.is_board()));
create policy messages_select on public.messages for select to authenticated
  using (exists (select 1 from public.message_threads t where t.id = thread_id));  -- dziedziczy regułę wątków
create policy messages_insert on public.messages for insert to authenticated
  with check (
    author_id = (select auth.uid()) and (select public.is_active_member())
    and exists (select 1 from public.message_threads t
                 where t.id = thread_id and (t.member_id = (select auth.uid()) or (select public.is_board()))));

-- audit_log: tylko odczyt dla zarządu; zapis wyłącznie przez wyzwalacz audit_row
create policy audit_log_select on public.audit_log for select to authenticated
  using ((select public.is_board()));
