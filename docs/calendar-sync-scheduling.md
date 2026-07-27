# Property calendar synchronisation

`POST /api/internal/calendar-sync` processes a bounded batch of active reservation calendars. Call it with:

```text
Authorization: Bearer <CALENDAR_SYNC_SECRET>
```

The route is ready for Vercel Cron, a Supabase scheduled function, or another trusted scheduler. No scheduler is configured by this repository. A 10–15 minute deployment schedule is appropriate, but the application does not promise an exact interval.

Required deployment secrets:

- `CALENDAR_SYNC_SECRET`: a long random bearer secret for the internal route.
- `CALENDAR_URL_ENCRYPTION_KEY`: at least 32 random characters, used to encrypt saved calendar URLs with AES-256-GCM.

Apply `202607270002_prevent_reservation_overlaps.sql` before `202607270003_property_calendar_sync.sql`.
