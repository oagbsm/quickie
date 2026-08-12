import { calculateCleaningQuote } from "@/lib/cleaningPricing";
import type { MarketplaceJob } from "@/app/data/marketplace";

export type MarketplaceEstimate = { service: string; estimatedPricePence: number | null; priceRangeLowPence: number | null; priceRangeHighPence: number | null; bookingFeePence: number | null; pricingConfidence: "high" | "range" | "not_configured"; explanation: string; breakdown: { label: string; amountPence?: number }[] };
export const marketplaceBookingFee = { type: "not_configured" as const, valuePence: null as number | null };
export function estimateMarketplacePrice(service: MarketplaceJob, answers: Record<string, string | number | string[]>): MarketplaceEstimate {
  if (service.pricingModel !== "cleaning_deterministic") return { service: service.slug, estimatedPricePence: null, priceRangeLowPence: null, priceRangeHighPence: null, bookingFeePence: null, pricingConfidence: "not_configured", explanation: "We need a little more information for this job. A local professional can review the details and provide pricing.", breakdown: [] };
  const cleanType = String(answers.cleanType || "One-off"); const quote = calculateCleaningQuote({ service: cleanType === "Regular" ? "Domestic clean" : cleanType, frequency: cleanType === "Regular" ? "Weekly" : "One-off", property: "House", floor: "Ground / lift", bedrooms: Number(answers.bedrooms || 1), bathrooms: Number(answers.bathrooms || 1), condition: "Tidy — just needs a clean", lastClean: "Cleaned regularly", extras: [], parking: "Free / driveway" });
  return { service: service.slug, estimatedPricePence: quote.price * 100, priceRangeLowPence: null, priceRangeHighPence: null, bookingFeePence: marketplaceBookingFee.valuePence, pricingConfidence: "high", explanation: "Indicative cleaning estimate based on the selected clean type, rooms and the current Quickola cleaning model.", breakdown: [{ label: `${quote.hours} hours estimated`, amountPence: quote.price * 100 }] };
}
