-- Wartość benefitu (w groszach) i data wydania karty benefitowej
alter table public.benefits add column value_grosz int check (value_grosz is null or value_grosz >= 0);
alter table public.benefit_requests add column card_issued_on date;

update public.benefits set value_grosz = 7700 where name ilike 'Karta Multisport%';
update public.benefits set value_grosz = 21700 where name ilike 'Ubezpieczenie%';
