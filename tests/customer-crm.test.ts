import assert from "node:assert/strict";
import test from "node:test";
import { customerMetrics, genuineCustomerBooking, netBookingValue, rebookingOpportunity, relationshipState, repeatRate } from "../lib/marketplace/customer-crm.ts";

const day = (offset: number) => new Date(Date.UTC(2026, 8, 5 - offset)).toISOString();
const booking = (id: string, jobId: string, overrides: Record<string, unknown> = {}) => ({ id, job_id: jobId, customer_id: "c1", provider_id: "p1", amount_pence: 10000, refunded_amount_pence: 0, payment_status: "paid", status: "completed", created_at: day(10), ...overrides });

test("CRM genuine booking definition includes partial refunds and excludes unpaid/cancelled/full refunds", () => {
  assert.equal(genuineCustomerBooking(booking("paid", "j1")), true);
  assert.equal(genuineCustomerBooking(booking("partial", "j1", { refunded_amount_pence: 2500, payment_status: "paid" })), true);
  assert.equal(genuineCustomerBooking(booking("unpaid", "j1", { payment_status: "pending_payment" })), false);
  assert.equal(genuineCustomerBooking(booking("cancelled", "j1", { status: "cancelled" })), false);
  assert.equal(genuineCustomerBooking(booking("refunded", "j1", { payment_status: "refunded", refunded_amount_pence: 10000 })), false);
});

test("CRM metrics use net spend, completed bookings, latest service, and review averages", () => {
  const jobs = [{ id: "j1", customer_id: "c1", service: "plumbing", service_subtype: "drain-unblocking", created_at: day(20) }, { id: "j2", customer_id: "c1", service: "cleaning", service_subtype: "one-off-cleaning", created_at: day(10) }];
  const bookings = [booking("b1", "j1", { amount_pence: 26600, refunded_amount_pence: 5000 }), booking("b2", "j2", { amount_pence: 7400, created_at: day(5) })];
  const metrics = customerMetrics(bookings, jobs, [{ customer_id: "c1", provider_id: "p1", booking_id: "b2", rating: 5, created_at: day(2) }]);
  assert.equal(metrics.spendPence, 29000);
  assert.equal(metrics.averageBookingPence, 14500);
  assert.equal(metrics.completed.length, 2);
  assert.equal(metrics.mostUsedService, "One-off cleaning");
  assert.equal(metrics.averageRating, 5);
  assert.equal(netBookingValue(bookings[0]), 21600);
});

test("repeat rate uses genuine bookers as denominator and is safe at zero", () => {
  const one = { bookings: [booking("b1", "j1")] }; const two = { bookings: [booking("b1", "j1"), booking("b2", "j2")] }; const unpaid = { bookings: [booking("u", "j1", { payment_status: "pending_payment" })] };
  assert.deepEqual(repeatRate([one, two, unpaid]), { bookers: 2, repeat: 1, rate: 0.5 });
  assert.deepEqual(repeatRate([]), { bookers: 0, repeat: 0, rate: 0 });
});

test("risk, rebooking, lapsed, and emergency-service rules are conservative", () => {
  const cleaningJob = { id: "j1", customer_id: "c1", service: "cleaning", service_subtype: "one-off-cleaning", created_at: day(100) };
  const drainJob = { id: "j2", customer_id: "c1", service: "plumbing", service_subtype: "drain-unblocking", created_at: day(100) };
  const oldCleaning = booking("b1", "j1", { created_at: day(45) });
  assert.equal(rebookingOpportunity([oldCleaning], [cleaningJob], []).length, 1);
  assert.equal(rebookingOpportunity([booking("b2", "j2", { created_at: day(200) })], [drainJob], []).length, 0);
  assert.equal(relationshipState({ bookings: [oldCleaning], jobs: [cleaningJob], issues: [], reviews: [], refunds: [], now: new Date(day(0)).getTime() }).state, "REBOOK DUE");
  assert.equal(relationshipState({ bookings: [booking("b3", "j1", { created_at: day(250) })], jobs: [cleaningJob], issues: [], reviews: [], refunds: [], now: new Date(day(0)).getTime() }).state, "LAPSED");
  assert.equal(relationshipState({ bookings: [oldCleaning], jobs: [cleaningJob], issues: [{ booking_id: "b1", status: "open" }], reviews: [], refunds: [], now: new Date(day(0)).getTime() }).state, "AT RISK");
  assert.equal(relationshipState({ bookings: [oldCleaning], jobs: [cleaningJob], issues: [{ booking_id: "b1", status: "resolved_customer" }], reviews: [], refunds: [], now: new Date(day(0)).getTime() }).state, "REBOOK DUE");
});
