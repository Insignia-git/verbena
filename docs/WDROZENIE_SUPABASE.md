# Wdrożenie strony konkursowej (Supabase + statyczny hosting)

## 1) Konfiguracja bazy
1. W projekcie Supabase uruchom SQL z pliku `sql/supabase-schema.sql`.
2. Jeśli baza była już wcześniej uruchomiona na starszym formularzu, uruchom dodatkowo `sql/supabase-migration-2026-03-04.sql`.
3. Jeśli chcesz panel admin, uruchom też `sql/supabase-migration-admin-2026-03-04.sql`.
4. Ustaw własny kod administratora (zamiast domyślnego):

```sql
update public.admin_access
set pass_hash = md5('TU_WPISZ_MOCNY_KOD_ADMINA'),
    updated_at = now()
where id = 1;
```

5. Skopiuj `Project URL` i `anon public key`.
6. Uzupełnij plik `assets/js/supabase-config.js`.

## 2) Jak to działa
- `index.html` zawiera dwie zakładki: rejestrację zgłoszenia oraz sprawdzanie statusu.
- Rejestracja zapisuje zgłoszenie do tabeli `contest_submissions`.
- Status pobiera dane przez RPC `check_submission_status`.
- Zdjęcie paragonu (wymagane) zapisuje się do bucketu `konkurs-zgloszenia`.
- `admin/index.html` to prosty panel administratora (lista zgłoszeń, paragon, akceptacja, odrzucenie, przywrócenie odrzuconych).

## 3) CORS i domena produkcyjna
Docelowa domena: `https://radosnysmakwiosny.verbena.pl`

- Dla standardowego REST/RPC Supabase (PostgREST) przeglądarka powinna działać bez dodatkowej konfiguracji CORS po stronie hostingu statycznego.
- Jeśli będziesz używać Supabase Edge Functions, ustaw w odpowiedzi nagłówki CORS co najmniej dla origin:
  - `https://radosnysmakwiosny.verbena.pl`
- W Supabase Auth (jeśli będzie używane), dodaj domenę do `Site URL` i `Redirect URLs`.

## 4) Publikacja plików statycznych
Na hosting wrzuć minimum:
- `index.html`,
- `admin/index.html`,
- `assets/js/supabase-config.js`,
- `assets/js/cookie-consent.js`,
- ewentualnie ten plik instrukcji.

## 5) Dane organizatora (ustawione)
- Insignia Sp. z o.o.
- NIP: 6772376926
- REGON: 122942704
- Podole 60, 30-394 Kraków, woj. małopolskie

Regulamin, klauzule i kanały kontaktu można dopisać po otrzymaniu finalnej treści od klienta.

## 6) Potwierdzenie e-mail po zgloszeniu (Edge Function)

Frontend po poprawnym zapisie zgloszenia wywoluje funkcje `send-confirmation-email`.

1. Ustaw sekrety w Supabase:

```bash
supabase secrets set RESEND_API_KEY=twoj_klucz
supabase secrets set RESEND_FROM="Konkurs Verbena <noreply@twojadomena.pl>"
```

2. Wdroz funkcje:

```bash
supabase functions deploy send-confirmation-email
```

3. Upewnij sie, ze w `assets/js/supabase-config.js` masz:
- `confirmationFunction: "send-confirmation-email"`
- `sendConfirmationEmail: true`

Uwagi:
- Brak wysylki e-maila nie blokuje zapisu zgloszenia (zgloszenie jest nadal przyjete).
- Tresc i temat maila ustawisz w `supabase/functions/send-confirmation-email/index.ts`.
