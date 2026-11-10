-- ZNP w CMKP – prywatne miejsca na pliki i dane startowe

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png']),
  ('documents', 'documents', false, 20971520, array['application/pdf']),
  ('imports', 'imports', false, 10485760, array['text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream']);

-- Zdjęcia: plik <id członka>.jpg|.png; członek widzi i zmienia tylko swoje, zarząd wszystkie
create policy photos_select on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (split_part(name, '.', 1) = (select auth.uid())::text or (select public.is_board())));
create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (split_part(name, '.', 1) = (select auth.uid())::text or (select public.is_board())));
create policy photos_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (split_part(name, '.', 1) = (select auth.uid())::text or (select public.is_board())));
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (split_part(name, '.', 1) = (select auth.uid())::text or (select public.is_board())));

-- Dokumenty: członek czyta tylko pliki opublikowanych dokumentów; zapis tylko zarząd
create policy documents_select on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (
    (select public.is_board())
    or ((select public.is_active_member()) and exists (
         select 1 from public.documents d
          where d.file_path = storage.objects.name and d.is_published and d.published_at <= now()))));
create policy documents_board_write on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (select public.is_board()));
create policy documents_board_update on storage.objects for update to authenticated
  using (bucket_id = 'documents' and (select public.is_board()));
create policy documents_board_delete on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (select public.is_board()));

-- Wyciągi: tylko zarząd
create policy imports_board_select on storage.objects for select to authenticated
  using (bucket_id = 'imports' and (select public.is_board()));
create policy imports_board_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'imports' and (select public.is_board()));
create policy imports_board_delete on storage.objects for delete to authenticated
  using (bucket_id = 'imports' and (select public.is_board()));

-- Dane startowe
insert into public.board_roles (name, sort_order) values
  ('Prezes', 1), ('Wiceprezes', 2), ('Skarbnik', 3), ('Sekretarz', 4), ('Członek zarządu', 5);

insert into public.document_categories (name, sort_order) values
  ('Projekty uchwał', 1), ('Protokoły', 2), ('Akty wewnętrzne', 3), ('Formularze', 4);

insert into public.benefits (name, category, description, sort_order) values
  ('Karta Multisport', 'Sport i rekreacja', 'Dostęp do obiektów sportowych na preferencyjnych warunkach. Szczegóły dopłaty uzupełni zarząd.', 1),
  ('Ubezpieczenie grupowe', 'Ubezpieczenia', 'Grupowe ubezpieczenie na życie dla członków. Zakres i składkę uzupełni zarząd.', 2);
