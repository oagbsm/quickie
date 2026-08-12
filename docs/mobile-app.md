# Quickola mobile app

The initial cleaner app lives in `apps/mobile` and leaves the existing Next.js app, Supabase auth, RLS, storage, and cleaner workflows in place.

## Run locally

```sh
cd apps/mobile
npm install
cp .env.example .env.local
npx expo start
```

Mobile Supabase configuration comes from the repository root `.env.local`; do not create a second credential file under `apps/mobile`. `apps/mobile/app.config.ts` explicitly maps `NEXT_PUBLIC_SUPABASE_URL` to `EXPO_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Only those two public values are forwarded into Expo. Never add a service-role key, database password, email key, or admin credential to the mobile configuration.

For iOS and Android, use a physical device for camera and push-token testing. Expo Go is useful for the first UI pass; use a development build before production release so notification and native permission configuration is reproducible.

## Architecture

- Expo Router provides `/sign-in`, cleaner access gating, and the `Today`, `Jobs`, and `Profile` tabs.
- Supabase JS uses the existing project and stores the auth session in `expo-secure-store`.
- TanStack Query caches jobs and invalidates after lifecycle, checklist, and evidence mutations.
- Cleaner access is derived from the existing `workers` row (`user_id`, active status, accepted invitation) and every job query remains assignment-scoped under RLS.
- Lifecycle actions call the existing `transition_work_item` RPC. Completion is submitted through the existing `evidence_submitted` transition and remains server-authoritative.
- Checklist data uses the existing `checklist_tasks` snapshot, including section/room labels, result types, notes, and photo requirements.
- Photos are resized locally, uploaded to the existing private `turnover-evidence` bucket, verified by inserting `evidence_submissions`, and only then reflected in the UI. A failed database confirmation removes the uploaded object and shows retry.
- `worker_push_tokens` is an additive, RLS-protected token table. It does not send notifications yet; it prepares the association for future assignment/change/cancellation events.

## Known boundaries

The app intentionally does not create properties or jobs, claim properties, expose host workflows, add payments, chat, AI verification, or a second backend. Access details are only requested after the existing cleaner lifecycle has reached an accepted state.
