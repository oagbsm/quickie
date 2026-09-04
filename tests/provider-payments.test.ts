import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateProviderEarnings, formatProviderPayoutStatus, isEligibleProviderEarnings } from "../lib/marketplace/provider-earnings.ts";

const page = readFileSync(new URL("../app/work/payments/page.tsx", import.meta.url), "utf8");
const navigation = readFileSync(new URL("../app/components/marketplace/ProviderHeaderNavigation.tsx", import.meta.url), "utf8");

test("provider earnings use the combined ten percent fee in integer pence", () => {
  assert.deepEqual(calculateProviderEarnings(10000), { customerPaidPence: 10000, totalFeesPence: 1000, providerEarningsPence: 9000 });
  assert.deepEqual(calculateProviderEarnings(16500), { customerPaidPence: 16500, totalFeesPence: 1650, providerEarningsPence: 14850 });
  assert.deepEqual(calculateProviderEarnings(16500, 500), { customerPaidPence: 16000, totalFeesPence: 1600, providerEarningsPence: 14400 });
});

test("only verified paid completed bookings are eligible for payout totals", () => {
  const earnings = calculateProviderEarnings(10000);
  assert.equal(isEligibleProviderEarnings("pending_payment", "completed", earnings), false);
  assert.equal(isEligibleProviderEarnings("paid", "awaiting_customer_completion", earnings), false);
  assert.equal(isEligibleProviderEarnings("paid", "completed", earnings), true);
  assert.equal(formatProviderPayoutStatus({ paymentStatus: "paid", bookingStatus: "completed", transferStatus: "pending", payoutHoldStatus: "none", hasActiveDispute: false, earnings }), "Pending");
  assert.equal(formatProviderPayoutStatus({ paymentStatus: "paid", bookingStatus: "completed", transferStatus: "paid", payoutHoldStatus: "none", hasActiveDispute: false, earnings }), "Paid out");
  assert.equal(formatProviderPayoutStatus({ paymentStatus: "paid", bookingStatus: "completed", transferStatus: "pending", payoutHoldStatus: "held", hasActiveDispute: false, earnings }), "On hold");
  assert.equal(formatProviderPayoutStatus({ paymentStatus: "refunded", bookingStatus: "completed", transferStatus: "pending", payoutHoldStatus: "none", hasActiveDispute: false, earnings: calculateProviderEarnings(10000, 10000) }), "Refunded");
});

test("payments page is server-protected and navigation exposes it", () => {
  assert.match(page, /requireProviderWorkspaceAccess/);
  assert.match(page, /\.eq\("provider_id", provider\.providerId\)/);
  assert.match(page, /stripe processing fees are not shown separately/i);
  assert.match(navigation, /href="\/work\/payments"/);
});
