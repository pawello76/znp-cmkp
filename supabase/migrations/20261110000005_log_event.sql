-- Zapis zdarzeń bez zmiany danych (np. eksport listy członków) – tylko zarząd
create or replace function public.log_event(p_action text, p_details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_board() then
    raise exception 'Brak uprawnień' using errcode = '42501';
  end if;
  insert into public.audit_log (actor_id, action, table_name, details)
  values (auth.uid(), p_action, 'app', p_details);
end $$;
revoke execute on function public.log_event(text, jsonb) from public, anon;
grant execute on function public.log_event(text, jsonb) to authenticated;
