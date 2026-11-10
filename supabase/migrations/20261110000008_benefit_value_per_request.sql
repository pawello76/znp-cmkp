-- Wartość benefitu jest indywidualna: wpisuje ją zarząd przy przyznaniu (per członek i benefit).
-- Zamiast daty wydania karty używamy active_from ("aktywny od"), wpisywanej przez zarząd.
alter table public.benefits drop column value_grosz;
alter table public.benefit_requests drop column card_issued_on;
alter table public.benefit_requests add column value_grosz int check (value_grosz is null or value_grosz >= 0);
