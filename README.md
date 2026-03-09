# verbena
# Wdrożenie strony konkursowej (Supabase + statyczny hosting)
git status
git add .
git status (sprawdź co jest staged)
git commit -m "fix"
git push

git add .
git commit -m "first commit"
git push origin main
https://insignia-git.github.io/verbena/
## Aktualna struktura

Projekt działa jako single-page:
- `index.html` – zakładka Rejestracja + zakładka Status zgłoszenia,
- `admin/index.html` – prosty panel administracyjny zgłoszeń,
- `assets/images/` – grafiki (logo, header, ikony, packshoty),
- `assets/fonts/` – fonty lokalne (Geist i Yanone Kaffeesatz, woff2 + ttf fallback),
- `assets/css/main.css` – style landing page (wydzielone z `index.html`),
- `assets/js/supabase-config.js` – konfiguracja klienta Supabase,
- `assets/js/cookie-consent.js` – panel zgód cookies,
- `sql/supabase-schema.sql`, `sql/supabase-migration-2026-03-04.sql` i `sql/supabase-migration-admin-2026-03-04.sql` – SQL bazy,
- `docs/WDROZENIE_SUPABASE.md` – instrukcja wdrożeniowa.

## Panel cookies (RODO/ePrivacy)

W projekcie działa wspólny panel zgód cookies z pliku `assets/js/cookie-consent.js`.

### Co robi
- Zawsze aktywuje tylko cookies niezbędne.
- Dla kategorii opcjonalnych (`preferences`, `analytics`, `marketing`) zbiera świadomą zgodę użytkownika.
- Pozwala na: „Akceptuję wszystkie”, „Odrzuć opcjonalne” oraz granularny wybór w ustawieniach.
- Umożliwia zmianę decyzji przez przycisk „Zarządzaj cookies” widoczny na stronie.

### Jak podpiąć skrypt wymagający zgody

Jeśli dodajesz zewnętrzny skrypt analityczny/marketingowy, nie uruchamiaj go standardowo.
Użyj opóźnionego skryptu z kategorią zgody:

```html
<script type="text/plain" data-cookie-category="analytics" src="https://example.com/analytics.js"></script>
```

Dozwolone kategorie:
- `preferences`
- `analytics`
- `marketing`

Skrypt uruchomi się dopiero po wyrażeniu odpowiedniej zgody.
