import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const page = read("app/jobs/[token]/page.tsx");
const presentation = read("lib/marketplace/presentation.ts");

test("confirmed booking copy is driven by persisted payment state", () => {
  assert.match(page, /booking\.payment_status === "paid"/);
  assert.match(page, /Booking confirmed/);
  assert.match(page, /Payment processing/);
  assert.match(page, /paymentReturnPending = payment === "success" && acceptedBooking\?\.payment_status !== "paid"/);
  assert.doesNotMatch(page, /payment === "success".*Payment submitted/);
  assert.match(page, /getMarketplacePaymentState\(acceptedBooking\) === "paid" \? <BookingConfirmation/);
  assert.match(page, /<BookingPanel token=\{token\}/);
});

test("booking confirmation preserves real provider identity, photo fallback and routes", () => {
  assert.match(page, /resolveProviderPhotoUrl\(admin, acceptedProfile\?\.profile_photo_url\)/);
  assert.match(page, /providerPhotoUrl \? <img/);
  assert.match(page, /providerPhotoUrl \? <img[\s\S]*aria-hidden=\"true\"/);
  assert.match(page, /href=\{messageHref\}/);
  assert.match(page, /providers\/\$\{providerId\}/);
  assert.match(page, /What happens next\?/);
  const confirmation = page.slice(page.indexOf("function BookingConfirmation"), page.indexOf("function BookingPanel"));
  assert.doesNotMatch(confirmation, /BookingProgress|✓ Booked|○ Complete/);
});

test("provider display formatting is presentation-only and conservative", () => {
  assert.match(presentation, /name === name\.toLowerCase\(\)/);
  assert.match(presentation, /Your provider/);
  assert.match(page, /formatMarketplaceProviderName/);
});
