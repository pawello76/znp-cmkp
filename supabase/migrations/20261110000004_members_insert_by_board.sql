-- Zarząd wstawia wiersz członka (konto w Auth tworzy wcześniej serwer); dziennik zapisuje autora
create policy members_insert on public.members for insert to authenticated
  with check ((select public.is_board()));
