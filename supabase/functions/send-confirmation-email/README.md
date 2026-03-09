# send-confirmation-email

Edge Function wysylajaca e-mail potwierdzajacy po zapisie zgloszenia.

## Wymagane sekrety

- `RESEND_API_KEY`
- `RESEND_FROM` (np. `Konkurs Verbena <noreply@twojadomena.pl>`)

## Deploy

```bash
supabase functions deploy send-confirmation-email
```

## Ustawienie sekretow

```bash
supabase secrets set RESEND_API_KEY=twoj_klucz
supabase secrets set RESEND_FROM="Konkurs Verbena <noreply@twojadomena.pl>"
```

## Test lokalny

```bash
supabase functions serve send-confirmation-email --env-file .env.local
```
