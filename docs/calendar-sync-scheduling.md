# Property calendar synchronisation

`POST /api/internal/calendar-sync` processes a bounded batch of active reservation calendars. Call it with:

```text
Authorization: Bearer <CALENDAR_SYNC_SECRET>
```

The route is ready for Vercel Cron, a Supabase scheduled function, or another trusted scheduler. No scheduler is configured by this repository. Configure the deployment platform to invoke it every 10–15 minutes; the application itself selects only due connections.

For Vercel Cron, configure the project’s cron entry to call `/api/internal/calendar-sync` and attach the bearer header from the platform’s secret/header mechanism. A generic scheduler invocation is:

```sh
curl --fail --silent --show-error \
  -X POST "$APP_URL/api/internal/calendar-sync" \
  -H "Authorization: Bearer $CALENDAR_SYNC_SECRET"
```

`APP_URL` is supplied by the deployment environment; do not hardcode a production hostname in application code.

Required deployment secrets:

- `CALENDAR_SYNC_SECRET`: a long random bearer secret for the internal route.
- `CALENDAR_URL_ENCRYPTION_KEY`: at least 32 random characters, used to encrypt saved calendar URLs with AES-256-GCM.

Apply `202607270002_prevent_reservation_overlaps.sql` before `202607270003_property_calendar_sync.sql`.
Then apply `202608010001_sprint_4_calendar_scheduler.sql` to add due-time tracking and failure backoff.
