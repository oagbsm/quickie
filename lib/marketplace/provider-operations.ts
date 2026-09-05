import { isGenuineBooking, type OverviewBooking } from "./admin-overview.ts";

export type ProviderOperation = {
  provider_status?: string | null;
  stripe_status?: string | null;
  marketplace_active?: boolean | null;
  available_now?: boolean | null;
};

export type ProviderBooking = OverviewBooking & { provider_transfer_status?: string | null; provider_transferred_at?: string | null; updated_at?: string | null };

export const providerStatusLabel = (status?: string | null) => ({ approved: "Verified", pending_review: "Pending", action_required: "Action required", suspended: "Suspended", rejected: "Rejected", draft: "Pending" }[status || "draft"] || (status || "Unknown").replaceAll("_", " "));
export const isEligibleProvider = (provider: ProviderOperation) => provider.provider_status === "approved" && provider.stripe_status === "ready" && provider.marketplace_active === true && provider.available_now !== false;
export const activeProviderServices = (services: Array<{ category_slug?: string | null; job_type_slug?: string | null; active?: boolean | null }>) => services.filter((service) => service.active).map((service) => service.job_type_slug || service.category_slug || "Service");
export const activeProviderAreas = (areas: Array<{ postcode_district?: string | null; active?: boolean | null }>) => [...new Set(areas.filter((area) => area.active && area.postcode_district).map((area) => area.postcode_district!.trim().toUpperCase()))];

export function providerPayoutStatus(bookings: ProviderBooking[], now = Date.now()) {
  if (bookings.some((booking) => booking.provider_transfer_status === "failed")) return "Failed";
  if (bookings.some((booking) => booking.payout_hold_status === "held")) return "On hold";
  if (bookings.some((booking) => ["pending", "processing"].includes(booking.provider_transfer_status || ""))) return "Processing";
  if (bookings.some((booking) => booking.provider_transfer_status === "paid" && booking.provider_transferred_at && now - new Date(booking.provider_transferred_at).getTime() <= 7 * 86400000)) return "Paid recently";
  if (bookings.some((booking) => booking.provider_transfer_status === "blocked")) return "On hold";
  if (bookings.some((booking) => isGenuineBooking(booking))) return "Ready";
  return "—";
}

export function latestProviderActivity(providerId: string, quotes: Array<{ provider_id?: string | null; created_at: string }>, bookings: Array<{ provider_id?: string | null; created_at: string; updated_at?: string | null }>) {
  const dates = [...quotes.filter((quote) => quote.provider_id === providerId).map((quote) => quote.created_at), ...bookings.filter((booking) => booking.provider_id === providerId).flatMap((booking) => [booking.created_at, booking.updated_at].filter((value): value is string => Boolean(value)))];
  return dates.length ? dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] : null;
}

export function isInactiveProvider(providerId: string, quotes: Array<{ provider_id?: string | null; created_at: string }>, bookings: Array<{ provider_id?: string | null; created_at: string; updated_at?: string | null }>, now = Date.now()) {
  const latest = latestProviderActivity(providerId, quotes, bookings);
  return !latest || now - new Date(latest).getTime() >= 7 * 86400000;
}

export const needsAttention = ({ pending, issueCount, failedPayout, actionRequired, inactive }: { pending: boolean; issueCount: number; failedPayout: boolean; actionRequired: boolean; inactive: boolean }) => pending || issueCount > 0 || failedPayout || actionRequired || inactive;

export function supplyLabel(count: number) {
  if (count === 0) return "NOT COVERED";
  if (count < 5) return "NEED MORE SUPPLY";
  if (count < 10) return "BUILDING";
  return "HEALTHY";
}

export const quoteConversion = (won: number, quotes: number) => quotes > 0 ? `${(won / quotes * 100).toFixed(1)}%` : "0%";
