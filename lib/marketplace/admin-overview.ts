import { calculateProviderEarnings } from "./provider-earnings.ts";
import { ACTIVE_MARKETPLACE_OFFER_STATUSES } from "./customer-job-state.ts";

export type OverviewJob = { id: string; service?: string | null; service_subtype?: string | null; postcode?: string | null; created_at: string; status?: string | null };
export type OverviewQuote = { job_id: string; status?: string | null; created_at: string };
export type OverviewBooking = { id: string; job_id: string; amount_pence?: number | null; refunded_amount_pence?: number | null; payment_status?: string | null; status?: string | null; completion_status?: string | null; payout_hold_status?: string | null; payout_hold_reason?: string | null; created_at: string; customer_completed_at?: string | null; marketplace_jobs?: OverviewJob | OverviewJob[] | null; marketplace_customers?: { display_name?: string | null; email?: string | null } | { display_name?: string | null; email?: string | null }[] | null };
export type OverviewDispute = { booking_id: string; status: string; opened_at: string; marketplace_bookings?: OverviewBooking | OverviewBooking[] | null };
export type OverviewReview = { rating: number; created_at: string };

export const VALID_QUOTE_STATUSES = [...ACTIVE_MARKETPLACE_OFFER_STATUSES] as readonly string[];
export const outcodeOf = (postcode?: string | null) => (postcode || "").trim().toUpperCase().split(/\s+/)[0] || "Unknown";
export const relationOne = <T,>(value: T | T[] | null | undefined): T | null => Array.isArray(value) ? value[0] || null : value || null;
export const moneyPence = (pence: number) => `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const percent = (part: number, total: number) => total > 0 ? `${Math.round((part / total) * 100)}%` : "0%";
export const isGenuineBooking = (booking: OverviewBooking) => {
  const remaining = Math.max(0, Number(booking.amount_pence || 0) - Number(booking.refunded_amount_pence || 0));
  return ["paid", "partially_refunded"].includes(booking.payment_status || "") && booking.status !== "cancelled" && remaining > 0;
};
export const isActiveIssue = (status?: string | null) => ["open", "in_review"].includes(status || "");
export const jobLabel = (job?: OverviewJob | null) => (job?.service_subtype || job?.service || "Marketplace job").replaceAll("-", " ");

export function overviewMetrics({ jobs, quotes, bookings, disputes, reviews, providers, from, to }: { jobs: OverviewJob[]; quotes: OverviewQuote[]; bookings: OverviewBooking[]; disputes: OverviewDispute[]; reviews: OverviewReview[]; providers: Array<{ user_id?: string; marketplace_active?: boolean | null; provider_status?: string | null; postcode_districts?: string[] }>; from: Date; to: Date }) {
  const inRange = (value: string) => { const time = new Date(value).getTime(); return time >= from.getTime() && time < to.getTime(); };
  const periodJobs = jobs.filter((job) => inRange(job.created_at));
  const periodJobIds = new Set(periodJobs.map((job) => job.id));
  const periodQuotes = quotes.filter((quote) => periodJobIds.has(quote.job_id) && VALID_QUOTE_STATUSES.includes(quote.status || ""));
  const periodBookings = bookings.filter((booking) => periodJobIds.has(booking.job_id) && inRange(booking.created_at));
  const genuineBookings = periodBookings.filter(isGenuineBooking);
  const quotedJobIds = new Set(periodQuotes.map((quote) => quote.job_id));
  const activeIssues = disputes.filter((dispute) => isActiveIssue(dispute.status) && periodJobIds.has(relationOne(dispute.marketplace_bookings)?.job_id || ""));
  const issueBookingIds = new Set(activeIssues.map((issue) => issue.booking_id));
  const completed = genuineBookings.filter((booking) => booking.status === "completed" || booking.completion_status === "completed");
  const jobById = new Map(periodJobs.map((job) => [job.id, job]));
  const quotesByJob = new Map<string, OverviewQuote[]>();
  periodQuotes.forEach((quote) => quotesByJob.set(quote.job_id, [...(quotesByJob.get(quote.job_id) || []), quote]));
  const firstQuoteHours = periodJobs.flatMap((job) => { const first = [...(quotesByJob.get(job.id) || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]; return first ? [(new Date(first.created_at).getTime() - new Date(job.created_at).getTime()) / 3600000] : []; });
  const refundAwareValue = (booking: OverviewBooking) => Math.max(0, Number(booking.amount_pence || 0) - Number(booking.refunded_amount_pence || 0));
  const revenue = genuineBookings.reduce((sum, booking) => sum + calculateProviderEarnings(Number(booking.amount_pence || 0), Number(booking.refunded_amount_pence || 0)).totalFeesPence, 0);
  const gmv = genuineBookings.reduce((sum, booking) => sum + refundAwareValue(booking), 0);
  const services = Object.entries(periodJobs.reduce<Record<string, number>>((counts, job) => { const key = jobLabel(job); counts[key] = (counts[key] || 0) + 1; return counts; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const outcodes = Object.entries(periodJobs.reduce<Record<string, number>>((counts, job) => { const key = outcodeOf(job.postcode); counts[key] = (counts[key] || 0) + 1; return counts; }, {})).sort((a, b) => b[1] - a[1]);
  const noOfferJobs = periodJobs.filter((job) => !quotedJobIds.has(job.id));
  const noOfferAfter24h = noOfferJobs.filter((job) => Date.now() - new Date(job.created_at).getTime() >= 86400000);
  const issueRate = genuineBookings.length ? activeIssues.length / genuineBookings.length : 0;
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length : null;
  const eligibleProviders = providers.filter((provider) => provider.marketplace_active && provider.provider_status === "approved");
  return { periodJobs, periodQuotes, periodBookings, genuineBookings, quotedJobIds, activeIssues, issueBookingIds, completed, jobById, quotesByJob, firstQuoteHours, gmv, revenue, services, outcodes, noOfferJobs, noOfferAfter24h, averageRating, eligibleProviders, activeProviders: eligibleProviders.length, bookingRate: percent(genuineBookings.length, periodJobs.length), quoteRate: percent(quotedJobIds.size, periodJobs.length), completedRate: percent(completed.length, genuineBookings.length), issueRate, refundAwareValue };
}

export function expansionReadiness(metrics: ReturnType<typeof overviewMetrics>, selectedOutcode: string) {
  const jobs = metrics.periodJobs.filter((job) => outcodeOf(job.postcode) === selectedOutcode);
  const jobIds = new Set(jobs.map((job) => job.id));
  const quoted = [...metrics.quotedJobIds].filter((id) => jobIds.has(id)).length;
  const bookings = metrics.genuineBookings.filter((booking) => jobIds.has(booking.job_id));
  const completed = metrics.completed.filter((booking) => jobIds.has(booking.job_id));
  const unquotedAfter24h = metrics.noOfferAfter24h.filter((job) => jobIds.has(job.id)).length;
  const issues = metrics.activeIssues.filter((issue) => jobIds.has(relationOne(issue.marketplace_bookings)?.job_id || "")).length;
  const firstQuote = jobs.flatMap((job) => { const quote = [...(metrics.quotesByJob.get(job.id) || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]; return quote ? [(new Date(quote.created_at).getTime() - new Date(job.created_at).getTime()) / 3600000] : []; });
  const avgHours = firstQuote.length ? firstQuote.reduce((sum, value) => sum + value, 0) / firstQuote.length : Infinity;
  const activeProviders = metrics.eligibleProviders.filter((provider) => (provider.postcode_districts || []).map((code) => code.toUpperCase()).includes(selectedOutcode.toUpperCase())).length;
  const checks = [jobs.length >= 30, jobs.length > 0 && quoted / jobs.length >= .8, jobs.length > 0 && bookings.length / jobs.length >= .5, activeProviders >= 10, avgHours < 4, jobs.length > 0 && unquotedAfter24h / jobs.length < .1, bookings.length > 0 && issues / bookings.length < .1];
  const passed = checks.filter(Boolean).length;
  return { jobs, quoted, bookings, completed, unquotedAfter24h, issues, avgHours, activeProviders, checks, passed, status: passed <= 3 ? "EARLY" : passed <= 5 ? "BUILDING" : passed === 6 ? "NEARLY READY" : "READY TO EXPAND" };
}
