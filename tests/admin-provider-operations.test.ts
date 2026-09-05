import assert from "node:assert/strict";
import test from "node:test";
import { activeProviderAreas, activeProviderServices, isEligibleProvider, isInactiveProvider, providerPayoutStatus, quoteConversion, supplyLabel } from "../lib/marketplace/provider-operations.ts";

test("provider operations derive eligibility, services, areas and supply guidance", () => {
  assert.equal(isEligibleProvider({ provider_status: "approved", stripe_status: "ready", marketplace_active: true, available_now: true }), true);
  assert.equal(isEligibleProvider({ provider_status: "approved", stripe_status: "restricted", marketplace_active: true }), false);
  assert.deepEqual(activeProviderServices([{ job_type_slug: "plumbing", active: true }, { job_type_slug: "cleaning", active: false }]), ["plumbing"]);
  assert.deepEqual(activeProviderAreas([{ postcode_district: "sl6", active: true }, { postcode_district: "SL6", active: true }]), ["SL6"]);
  assert.deepEqual([0, 1, 4, 5, 9, 10].map(supplyLabel), ["NOT COVERED", "NEED MORE SUPPLY", "NEED MORE SUPPLY", "BUILDING", "BUILDING", "HEALTHY"]);
});

test("provider operations use trailing-period quotes and genuine bookings", () => {
  const quotes = [{ provider_id: "p1", created_at: "2026-09-01T00:00:00Z" }];
  const bookings = [{ id: "b1", provider_id: "p1", job_id: "j1", amount_pence: 10000, refunded_amount_pence: 0, payment_status: "paid", status: "completed", created_at: "2026-09-02T00:00:00Z", updated_at: "2026-09-02T01:00:00Z" }];
  assert.equal(providerPayoutStatus(bookings), "Ready");
  assert.equal(quoteConversion(1, quotes.length), "100.0%");
  assert.equal(isInactiveProvider("p1", quotes, bookings, new Date("2026-09-03T00:00:00Z").getTime()), false);
  assert.equal(isInactiveProvider("p2", quotes, bookings, new Date("2026-09-03T00:00:00Z").getTime()), true);
});

test("provider payout status prioritises failure, hold and processing states", () => {
  const base = { id: "b1", provider_id: "p1", job_id: "j1", amount_pence: 10000, refunded_amount_pence: 0, payment_status: "paid", status: "completed", created_at: "2026-09-01T00:00:00Z" };
  assert.equal(providerPayoutStatus([{ ...base, provider_transfer_status: "paid", provider_transferred_at: new Date().toISOString() }]), "Paid recently");
  assert.equal(providerPayoutStatus([{ ...base, provider_transfer_status: "pending" }, { ...base, provider_transfer_status: "failed" }]), "Failed");
  assert.equal(providerPayoutStatus([{ ...base, provider_transfer_status: "processing" }, { ...base, payout_hold_status: "held" }]), "On hold");
});
