# verbena
# Wdrożenie strony konkursowej (Supabase + statyczny hosting)

git add .
git commit -m "first commit"
git branch -M main

git push -u origin main
https://insignia-git.github.io/verbena/
## Aktualna struktura

Projekt działa jako single-page:
- `index.html` – zakładka Rejestracja + zakładka Status zgłoszenia,
- `admin/index.html` – prosty panel administracyjny zgłoszeń,
- `supabase-config.js` – konfiguracja klienta Supabase,
- `cookie-consent.js` – panel zgód cookies,
- `supabase-schema.sql`, `supabase-migration-2026-03-04.sql` i `supabase-migration-admin-2026-03-04.sql` – SQL bazy.

## Panel cookies (RODO/ePrivacy)

W projekcie działa wspólny panel zgód cookies z pliku `cookie-consent.js`.

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
