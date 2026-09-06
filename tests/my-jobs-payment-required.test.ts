import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/my-jobs/page.tsx", "utf8");

test("my jobs exposes the unpaid selected-provider actions", () => {
  assert.match(page, /state === "provider_selected_unpaid"/);
  assert.match(page, /Payment required/);
  assert.match(page, /Confirm &amp; pay/);
  assert.match(page, /View other offers/);
  assert.match(page, /CancelPrePaymentJobButton/);
});

test("my jobs does not expose pre-payment actions for paid or cancelled jobs", () => {
  assert.match(page, /getMarketplacePaymentState|payment_status/);
  assert.match(page, /job\.status === "cancelled"/);
  assert.match(page, /state !== "cancelled"/);
  assert.match(page, /const isBooked = !\["waiting_for_offers", "offers_received", "provider_selected_unpaid", "payment_pending", "cancelled"\]/);
});
