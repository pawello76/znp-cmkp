-- ZNP w CMKP – schemat danych (25 tabel)

-- Typy wyliczeniowe
create type public.member_status as enum ('aktywny', 'zablokowany', 'byly');
create type public.declaration_status as enum ('oczekuje', 'zatwierdzona', 'odrzucona');
create type public.payment_source as enum ('import', 'reczny');
create type public.import_status as enum ('podglad', 'zaksiegowany', 'anulowany');
create type public.match_status as enum ('auto', 'reczne', 'pominiete', 'brak');
create type public.poll_mode as enum ('jawne', 'tajne');
create type public.poll_majority as enum ('zwykla', 'bezwzgledna', 'dwie_trzecie');
create type public.poll_status as enum ('szkic', 'trwa', 'zakonczone');
create type public.task_status as enum ('w_toku', 'wykonane');
create type public.benefit_request_status as enum ('zgloszony', 'przyznany', 'odrzucony', 'zakonczony');
create type public.board_folder as enum ('aktualne', 'przeczytane', 'archiwalne');

-- Członkowie i konta -------------------------------------------------------
create table public.members (
  id uuid primary key references auth.users (id) on delete restrict,
  member_no text not null unique check (member_no ~ '^[0-9A-Za-z/-]{1,20}$'),
  first_name text not null,
  last_name text not null,
  email text,
  unit text,
  position text,
  joined_at date not null default current_date,
  card_valid_until date,
  photo_path text,
  is_board boolean not null default false,
  status public.member_status not null default 'aktywny',
  must_change_password boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id)
);

create table public.board_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.member_board_roles (
  member_id uuid not null references public.members (id) on delete cascade,
  board_role_id uuid not null references public.board_roles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, board_role_id)
);

create table public.declarations (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  unit text,
  position text,
  consent_statute boolean not null check (consent_statute),
  consent_rodo boolean not null check (consent_rodo),
  status public.declaration_status not null default 'oczekuje',
  decided_by uuid references public.members (id),
  decided_at timestamptz,
  member_id uuid references public.members (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id)
);

-- Składki ------------------------------------------------------------------
create table public.dues_rates (
  id uuid primary key default gen_random_uuid(),
  amount_grosz int not null check (amount_grosz > 0),
  valid_from date not null unique,
  created_at timestamptz not null default now()
);

create table public.bank_imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_path text,
  uploaded_by uuid references public.members (id),
  rows_total int not null default 0,
  rows_matched int not null default 0,
  status public.import_status not null default 'podglad',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id)
);

create table public.bank_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.bank_imports (id) on delete cascade,
  first_name text,
  last_name text,
  amount_grosz int not null,
  paid_on date not null,
  other text,
  matched_member_id uuid references public.members (id),
  match_status public.match_status not null default 'brak',
  created_at timestamptz not null default now()
);

create table public.dues_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id),
  paid_on date not null,
  period_from date not null,
  period_to date not null,
  amount_grosz int not null check (amount_grosz > 0),
  source public.payment_source not null,
  import_row_id uuid references public.bank_import_rows (id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id),
  check (period_to >= period_from)
);

-- Treści -------------------------------------------------------------------
create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lead text,
  body text,
  author_id uuid references public.members (id),
  published_at timestamptz not null default now(),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id)
);

create table public.news_reads (
  news_id uuid not null references public.news (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (news_id, member_id)
);

create table public.document_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references public.document_categories (id),
  file_path text not null,
  requires_ack boolean not null default false,
  published_at timestamptz not null default now(),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id)
);

create table public.document_acks (
  document_id uuid not null references public.documents (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  acked_at timestamptz not null default now(),
  primary key (document_id, member_id)
);

-- Głosowania ---------------------------------------------------------------
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  document_id uuid references public.documents (id),
  mode public.poll_mode not null,
  quorum_pct numeric(5, 2) not null default 50 check (quorum_pct between 0 and 100),
  majority public.poll_majority not null default 'zwykla',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  eligible_count int,
  status public.poll_status not null default 'szkic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id),
  check (ends_at > starts_at)
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- KTO głosował (frekwencja, blokada drugiego głosu)
create table public.poll_ballots (
  poll_id uuid not null references public.polls (id) on delete cascade,
  member_id uuid not null references public.members (id),
  voted_at timestamptz not null default now(),
  primary key (poll_id, member_id)
);

-- JAK głosowano; w trybie tajnym bez member_id i bez znacznika czasu
create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  member_id uuid references public.members (id)
);
create unique index poll_votes_one_named_vote on public.poll_votes (poll_id, member_id) where member_id is not null;

-- Wydarzenia, zadania, benefity ---------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  place text,
  capacity int check (capacity is null or capacity > 0),
  registration_open boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id)
);

create table public.event_registrations (
  event_id uuid not null references public.events (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  registered_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee_id uuid not null references public.members (id),
  due_on date,
  status public.task_status not null default 'w_toku',
  created_by uuid references public.members (id),
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id)
);

create table public.benefits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id)
);

create table public.benefit_requests (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references public.benefits (id),
  member_id uuid not null references public.members (id),
  status public.benefit_request_status not null default 'zgloszony',
  requested_at timestamptz not null default now(),
  decided_by uuid references public.members (id),
  decided_at timestamptz,
  active_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id)
);
create unique index benefit_requests_one_open on public.benefit_requests (benefit_id, member_id)
  where status in ('zgloszony', 'przyznany');

-- Wiadomości ---------------------------------------------------------------
create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id),
  subject text not null,
  to_board_role_id uuid references public.board_roles (id),
  board_folder public.board_folder not null default 'aktualne',
  member_last_read_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members (id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  author_id uuid not null references public.members (id),
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

-- Dziennik zdarzeń -----------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  table_name text not null,
  record_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Indeksy kluczy obcych i najczęstszych zapytań
create index on public.member_board_roles (board_role_id);
create index on public.declarations (status);
create index on public.declarations (decided_by);
create index on public.declarations (member_id);
create index on public.declarations (updated_by);
create index on public.members (updated_by);
create index on public.bank_imports (uploaded_by);
create index on public.bank_imports (updated_by);
create index on public.bank_import_rows (import_id);
create index on public.bank_import_rows (matched_member_id);
create index on public.dues_payments (member_id, period_to);
create index on public.dues_payments (import_row_id);
create index on public.dues_payments (updated_by);
create index on public.news (published_at desc);
create index on public.news (author_id);
create index on public.news (updated_by);
create index on public.news_reads (member_id);
create index on public.documents (category_id);
create index on public.documents (updated_by);
create index on public.document_acks (member_id);
create index on public.polls (document_id);
create index on public.polls (updated_by);
create index on public.poll_options (poll_id);
create index on public.poll_ballots (member_id);
create index on public.poll_votes (option_id);
create index on public.poll_votes (member_id);
create index on public.events (starts_at);
create index on public.events (updated_by);
create index on public.event_registrations (member_id);
create index on public.tasks (assignee_id);
create index on public.tasks (created_by);
create index on public.tasks (updated_by);
create index on public.benefits (updated_by);
create index on public.benefit_requests (member_id);
create index on public.benefit_requests (decided_by);
create index on public.benefit_requests (updated_by);
create index on public.message_threads (member_id);
create index on public.message_threads (to_board_role_id);
create index on public.message_threads (board_folder, last_message_at desc);
create index on public.message_threads (updated_by);
create index on public.messages (thread_id, created_at);
create index on public.messages (author_id);
create index on public.audit_log (created_at desc);

-- RLS włączone od razu na wszystkich tabelach (bez polityk = brak dostępu)
alter table public.members enable row level security;
alter table public.board_roles enable row level security;
alter table public.member_board_roles enable row level security;
alter table public.declarations enable row level security;
alter table public.dues_rates enable row level security;
alter table public.bank_imports enable row level security;
alter table public.bank_import_rows enable row level security;
alter table public.dues_payments enable row level security;
alter table public.news enable row level security;
alter table public.news_reads enable row level security;
alter table public.document_categories enable row level security;
alter table public.documents enable row level security;
alter table public.document_acks enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_ballots enable row level security;
alter table public.poll_votes enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.tasks enable row level security;
alter table public.benefits enable row level security;
alter table public.benefit_requests enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.audit_log enable row level security;
