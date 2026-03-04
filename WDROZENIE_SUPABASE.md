# Wdrożenie strony konkursowej (Supabase + statyczny hosting)

## 1) Konfiguracja bazy
1. W projekcie Supabase uruchom SQL z pliku `supabase-schema.sql`.
2. Jeśli baza była już wcześniej uruchomiona na starszym formularzu, uruchom dodatkowo `supabase-migration-2026-03-04.sql`.
3. Skopiuj `Project URL` i `anon public key`.
4. Uzupełnij plik `supabase-config.js`.

## 2) Jak to działa
- `index.html` zawiera dwie zakładki: rejestrację zgłoszenia oraz sprawdzanie statusu.
- Rejestracja zapisuje zgłoszenie do tabeli `contest_submissions`.
- Status pobiera dane przez RPC `check_submission_status`.
- Zdjęcie paragonu (wymagane) zapisuje się do bucketu `konkurs-zgloszenia`.

## 3) CORS i domena produkcyjna
Docelowa domena: `https://radosnysmakwiosny.verbena.pl`

- Dla standardowego REST/RPC Supabase (PostgREST) przeglądarka powinna działać bez dodatkowej konfiguracji CORS po stronie hostingu statycznego.
- Jeśli będziesz używać Supabase Edge Functions, ustaw w odpowiedzi nagłówki CORS co najmniej dla origin:
  - `https://radosnysmakwiosny.verbena.pl`
- W Supabase Auth (jeśli będzie używane), dodaj domenę do `Site URL` i `Redirect URLs`.

## 4) Publikacja plików statycznych
Na hosting wrzuć minimum:
- `index.html`,
- `supabase-config.js`,
- `cookie-consent.js`,
- ewentualnie ten plik instrukcji.

## 5) Dane organizatora (ustawione)
- Insignia Sp. z o.o.
- NIP: 6772376926
- REGON: 122942704
- Podole 60, 30-394 Kraków, woj. małopolskie

Regulamin, klauzule i kanały kontaktu można dopisać po otrzymaniu finalnej treści od klienta.
