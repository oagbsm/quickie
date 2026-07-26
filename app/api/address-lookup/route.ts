import { NextResponse } from "next/server";
import { normaliseUkPostcode, UK_POSTCODE_PATTERN } from "@/lib/uk-address";

export async function GET(request: Request) {
  const postcode = normaliseUkPostcode(new URL(request.url).searchParams.get("postcode") || "");
  if (!UK_POSTCODE_PATTERN.test(postcode)) return NextResponse.json({ error: "Enter a valid UK postcode." }, { status: 400 });
  const apiKey = process.env.GETADDRESS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Address lookup is not configured. Enter the address manually." }, { status: 503 });
  try {
    const response = await fetch(`https://api.getaddress.io/find/${encodeURIComponent(postcode)}?api-key=${encodeURIComponent(apiKey)}&expand=true`, { cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "No matching addresses were found. Enter the address manually." }, { status: response.status === 404 ? 404 : 502 });
    const body = await response.json() as { addresses?: Array<Record<string, string>> };
    return NextResponse.json({ addresses: (body.addresses || []).map((item) => ({ line1: item.line_1 || item.formatted_address?.split(",")[0] || "", line2: item.line_2 || "", city: item.town_or_city || "", county: item.county || "", postcode, country: "United Kingdom" })).filter((item) => item.line1) });
  } catch {
    return NextResponse.json({ error: "Address lookup is temporarily unavailable. Enter the address manually." }, { status: 502 });
  }
}
