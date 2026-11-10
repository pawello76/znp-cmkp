# ZNP w CMKP – aplikacja członkowska

Aplikacja webowa dla członków i zarządu ZNP w CMKP: logowanie numerem członkowskim, deklaracje,
konta, składki, głosowania jawne i tajne, wydarzenia, dokumenty, benefity, wiadomości.

Specyfikacja (stos, model danych, uprawnienia): dokument „ZNP w CMKP – stos technologiczny i model danych”.

## Stos

- Next.js (App Router) + TypeScript + Tailwind CSS, hosting Vercel (region fra1)
- Supabase (PostgreSQL + RLS, Auth, Storage), projekt `znp-cmkp`, region eu-central-1 (Frankfurt)

## Zmienne środowiskowe

Patrz `.env.example`. Klucz `SUPABASE_SECRET_KEY` ustawia się wyłącznie w Vercel
(Settings → Environment Variables) – nigdy w repozytorium.

## Baza danych

Migracje w `supabase/migrations` (zastosowane w projekcie Supabase):

1. `…_schema.sql` – 25 tabel, typy, indeksy, włączone RLS
2. `…_functions_rls.sql` – funkcje (m.in. `cast_vote`), wyzwalacze, dziennik zdarzeń, reguły RLS
3. `…_storage_seed.sql` – prywatne miejsca na pliki (`photos`, `documents`, `imports`) i dane startowe
4. `…_members_insert_by_board.sql` – zarząd dodaje członków
5. `…_log_event.sql` – zapis eksportów i resetów 2FA w dzienniku

Typy TypeScript bazy: `src/lib/supabase/types.ts` (generowane z projektu).

## Logowanie

Członek loguje się numerem członkowskim i hasłem. Serwer zamienia numer na techniczny login
`m-<numer>@login.znp-cmkp.invalid` (domena `.invalid` – poczta nigdy nie jest wysyłana).
Konta zakłada zarząd; hasło tymczasowe trzeba zmienić przy pierwszym logowaniu.

## Etapy

- [x] 1. Fundament: baza, RLS, testy uprawnień
- [x] 2. Konta: logowanie, zmiana hasła, deklaracje, lista członków z eksportem, legitymacja ze zdjęciem, 2FA zarządu
- [x] 3. Składki – wpis ręczny, edycja danych członka (import wyciągu odłożony)
- [x] 4. Aktualności, dokumenty (potwierdzenia odczytu), wydarzenia (zapisy)
- [ ] 5. Głosowania, zadania, benefity, wiadomości
- [ ] 6. Start
