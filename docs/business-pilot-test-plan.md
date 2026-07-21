# Quickola controlled Slough pilot test plan

Run this plan in a staging Supabase project after applying both portal migrations.

## Authentication

1. Add localhost, staging and production `/auth/callback` URLs to Supabase Auth redirect URLs.
2. Create a new business account with email confirmation enabled.
3. Confirm the email and verify the callback creates a cookie-backed session and opens onboarding.
4. Delete the test user's membership and account, sign in, and verify workspace repair creates one account and one owner membership.
5. Call `/business/continue` concurrently in two browser tabs and verify there is still one account and membership.
6. Finish onboarding, sign out, sign in again, and verify the dashboard opens directly.
7. Complete password recovery and verify the success message and subsequent sign-in.

## Accounts and service areas

1. Business Account A: add an SL1, SL2 or SL3 property and submit a cleaning request.
2. Business Account B: add a non-Slough property, verify booking is disabled, and join the coverage waitlist.
3. Verify neither account can read or mutate the other's account, membership, property, booking, issue, report, photo, invoice or notification through the Supabase client or direct REST calls.

## Operations lifecycle

1. Sign into the existing admin area and open Business portal.
2. Review Account A's request, confirm price/date, and assign an existing provider.
3. Open the generated provider completion link. Verify it exposes only that assigned job.
4. Start the clean. Attempt completion without a checklist or photo and verify it is rejected.
5. Submit all checklist items and at least one valid JPG, PNG or WEBP under 5MB.
6. Retry completion and verify there is one report and one `property_ready` in-app notification.
7. Sign in as Account A and verify the protected report, signed photos and “Your property is ready.” state.
8. Verify Account B and anonymous requests cannot open the photos.

## Regression and devices

1. Complete the residential instant-price and guest booking flow.
2. Check `/business`, signup, onboarding, dashboard, properties and booking at 360px, tablet and desktop widths.
3. Keyboard-test navigation, dialogs/forms, focus visibility, validation and error messages.
4. Check browser console and network logs for hydration, authorization and duplicate-submission errors.
