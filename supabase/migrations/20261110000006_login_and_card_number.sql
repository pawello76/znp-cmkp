-- Logowanie loginem (ustala zarząd); numer członkowski staje się opcjonalny i nadawany później
alter table public.members add column login text;
update public.members set login = regexp_replace(member_no, '\D', '', 'g');
alter table public.members alter column login set not null;
alter table public.members add constraint members_login_key unique (login);
alter table public.members add constraint members_login_format check (login ~ '^[0-9]{4,15}$');
alter table public.members alter column member_no drop not null;

-- Techniczne loginy w Auth: l-<login>@login.znp-cmkp.invalid
update auth.users u
   set email = 'l-' || m.login || '@login.znp-cmkp.invalid'
  from public.members m
 where m.id = u.id;
update auth.identities i
   set identity_data = jsonb_set(i.identity_data, '{email}', to_jsonb(u.email))
  from auth.users u
 where u.id = i.user_id and i.provider = 'email';

-- Numer karty benefitowej wpisywany przez zarząd
alter table public.benefit_requests add column card_number text check (card_number is null or length(card_number) <= 64);
