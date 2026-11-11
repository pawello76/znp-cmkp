-- Forma opłaty składek członka: pracodawca (potrącenie z wynagrodzenia) lub przelew
alter table public.members add column dues_method text check (dues_method in ('pracodawca','przelew'));
