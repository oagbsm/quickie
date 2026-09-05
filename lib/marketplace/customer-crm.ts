import { getMarketplaceJobDisplayTitle } from "../../app/data/marketplace.ts";
import { isGenuineBooking, type OverviewBooking } from "./admin-overview.ts";

export type CrmBooking = OverviewBooking & { customer_id?: string | null; provider_id?: string | null; updated_at?: string | null; completion_status?: string | null };
export type CrmReview = { customer_id?: string | null; provider_id?: string | null; booking_id: string; rating: number; created_at: string; review_text?: string | null };
export type CrmIssue = { booking_id: string; status: string; reason_code?: string | null; opened_at?: string | null };
export type CrmRefund = { booking_id: string; amount_pence: number; status: string; created_at?: string | null };
export type CrmJob = { id: string; customer_id?: string | null; service?: string | null; service_subtype?: string | null; postcode?: string | null; created_at: string };

export type RebookingPolicy = { category: string; days: number };
export const REBOOKING_POLICIES: RebookingPolicy[] = [
  { category: "cleaning", days: 30 },
  { category: "gardening", days: 60 },
];

export function rebookingPolicy(service?: string | null) { return REBOOKING_POLICIES.find((policy) => policy.category === service) || null; }
export function genuineCustomerBooking(booking: CrmBooking) { return Boolean(booking.customer_id) && isGenuineBooking(booking); }
export function netBookingValue(booking: CrmBooking) { return Math.max(0, Number(booking.amount_pence || 0) - Number(booking.refunded_amount_pence || 0)); }
export function humanService(job?: CrmJob | null) { return getMarketplaceJobDisplayTitle(job?.service, job?.service_subtype, job?.service_subtype || job?.service); }
export function relativeAge(date?: string | null, now = Date.now()) { if (!date) return null; return Math.max(0, Math.floor((now - new Date(date).getTime()) / 86400000)); }
export function relativeDateLabel(date?: string | null, now = Date.now()) { const age = relativeAge(date, now); if (age === null) return "—"; if (age === 0) return "Today"; if (age === 1) return "Yesterday"; return age >= 60 ? `${Math.floor(age / 30)}mo ago` : `${age}d ago`; }

export function rebookingOpportunity(bookings: CrmBooking[], jobs: CrmJob[], reviews: CrmReview[], now = Date.now()) {
  const genuine = bookings.filter(genuineCustomerBooking).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const opportunities = genuine.flatMap((booking) => {
    const job = jobs.find((candidate) => candidate.id === booking.job_id);
    const policy = rebookingPolicy(job?.service);
    const age = relativeAge(booking.created_at, now);
    if (!policy || booking.status !== "completed" || age === null || age < policy.days || age > 180) return [];
    const bookingReview = reviews.find((review) => review.booking_id === booking.id);
    return [{ booking, job, policy, age, review: bookingReview }];
  });
  return opportunities.filter((candidate, index, all) => all.findIndex((item) => item.job?.service === candidate.job?.service) === index);
}

export function riskReasons(bookings: CrmBooking[], issues: CrmIssue[], reviews: CrmReview[], refunds: CrmRefund[], now = Date.now()) {
  const genuineIds = new Set(bookings.filter(genuineCustomerBooking).map((booking) => booking.id));
  const reasons: string[] = [];
  if (issues.some((issue) => ["open", "in_review"].includes(issue.status) && genuineIds.has(issue.booking_id))) reasons.push("Open issue");
  const recentReview = reviews.filter((review) => relativeAge(review.created_at, now) !== null && relativeAge(review.created_at, now)! <= 90).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  if (recentReview && recentReview.rating <= 3) reasons.push(`${recentReview.rating}★ latest review`);
  const successfulRefunds = refunds.filter((refund) => refund.status === "succeeded" && genuineIds.has(refund.booking_id) && (!refund.created_at || (relativeAge(refund.created_at, now) ?? 999) <= 90)).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  const issueBookingIds = new Set(issues.map((issue) => issue.booking_id));
  const recoveredRefund = successfulRefunds.find((refund) => bookings.some((booking) => genuineCustomerBooking(booking) && booking.status === "completed" && !issueBookingIds.has(booking.id) && !refunds.some((candidate) => candidate.booking_id === booking.id && candidate.status === "succeeded") && new Date(booking.created_at).getTime() > new Date(refund.created_at || 0).getTime()));
  if (successfulRefunds[0] && !recoveredRefund) reasons.push(`Recent ${formatPence(successfulRefunds[0].amount_pence)} refund`);
  return reasons;
}

export function atRiskReason(bookings: CrmBooking[], issues: CrmIssue[], reviews: CrmReview[], refunds: CrmRefund[], now = Date.now()) { return riskReasons(bookings, issues, reviews, refunds, now)[0] || null; }

export function relationshipState({ bookings, jobs, issues, reviews, refunds, now = Date.now() }: { bookings: CrmBooking[]; jobs: CrmJob[]; issues: CrmIssue[]; reviews: CrmReview[]; refunds: CrmRefund[]; now?: number }) {
  const genuine = bookings.filter(genuineCustomerBooking).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const risk = atRiskReason(bookings, issues, reviews, refunds, now);
  if (risk) return { state: "AT RISK", reason: risk } as const;
  const opportunities = rebookingOpportunity(bookings, jobs, reviews, now);
  if (opportunities.length) return { state: "REBOOK DUE", reason: "Potential rebooking opportunity" } as const;
  const latestAge = relativeAge(genuine[0]?.created_at, now);
  const hasRecurring = genuine.some((booking) => rebookingPolicy(jobs.find((job) => job.id === booking.job_id)?.service));
  const repeat = genuine.length >= 2;
  if (repeat && latestAge !== null && latestAge > 180 && hasRecurring) return { state: "LAPSED", reason: "No recent recurring booking" } as const;
  if (repeat && latestAge !== null && latestAge <= 180) return { state: "REPEAT", reason: "Two or more genuine bookings" } as const;
  if (genuine.length && latestAge !== null && latestAge <= 90) return { state: genuine.length === 1 && latestAge <= 30 ? "NEW" : "ACTIVE", reason: genuine.length === 1 ? "First booking relationship" : "Recently booked" } as const;
  if ((genuine.length >= 2 || hasRecurring) && latestAge !== null && latestAge > 180) return { state: "LAPSED", reason: "No recent recurring booking" } as const;
  return { state: genuine.length ? "NEW" : "NEW", reason: genuine.length ? "First booking relationship" : "No genuine booking yet" } as const;
}

export function customerMetrics(bookings: CrmBooking[], jobs: CrmJob[], reviews: CrmReview[]) {
  const genuine = bookings.filter(genuineCustomerBooking).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const completed = genuine.filter((booking) => booking.status === "completed");
  const latest = genuine[0];
  const serviceCounts = new Map<string, number>();
  genuine.forEach((booking) => { const service = humanService(jobs.find((job) => job.id === booking.job_id)); serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1); });
  const mostUsedService = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const reviewRows = reviews.filter((review) => review.customer_id);
  return { genuine, completed, latest, mostUsedService, spendPence: genuine.reduce((sum, booking) => sum + netBookingValue(booking), 0), averageBookingPence: genuine.length ? Math.round(genuine.reduce((sum, booking) => sum + netBookingValue(booking), 0) / genuine.length) : 0, reviews: reviewRows, averageRating: reviewRows.length ? reviewRows.reduce((sum, review) => sum + Number(review.rating), 0) / reviewRows.length : null };
}

export function repeatRate(customers: Array<{ bookings: CrmBooking[] }>) { const bookers = customers.filter((customer) => customer.bookings.some(genuineCustomerBooking)).length; const repeat = customers.filter((customer) => customer.bookings.filter(genuineCustomerBooking).length >= 2).length; return { bookers, repeat, rate: bookers ? repeat / bookers : 0 }; }
export function formatPence(pence: number) { return `£${(Number(pence || 0) / 100).toFixed(2)}`; }
export function valueLabel(spendPence: number, genuineBookings: number) { if (!genuineBookings) return "REGISTERED"; if (spendPence >= 50000) return "HIGH VALUE"; if (genuineBookings >= 2) return "REPEAT"; return "CUSTOMER"; }
