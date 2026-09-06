import "server-only";
import { headers } from "next/headers";
import { isIP } from "node:net";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const CURRENT_PROVIDER_TERMS_VERSION = "provider-2026-09";
export const CURRENT_PROVIDER_TERMS_EFFECTIVE_DATE = "2026-09-06";
export const CURRENT_PROVIDER_PRIVACY_NOTICE_VERSION = "privacy-provider-2026-09";

function requestEvidence(requestHeaders: Headers) {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = requestHeaders.get("x-real-ip")?.trim() || forwarded || "";
  return { ip_address: candidate && isIP(candidate) ? candidate : null, user_agent: requestHeaders.get("user-agent")?.trim() || null };
}

/** privacy_notice/presented means the notice was shown, not that consent was given. */
export async function recordProviderLegalEvent(providerId: string, documentType: "provider_terms" | "privacy_notice", documentVersion: string, eventType: "accepted" | "presented") {
  const evidence = requestEvidence(await headers());
  const result = await createSupabaseAdminClient().from("marketplace_provider_legal_acceptances").upsert({ provider_id: providerId, document_type: documentType, document_version: documentVersion, event_type: eventType, ...evidence }, { onConflict: "provider_id,document_type,document_version,event_type", ignoreDuplicates: true });
  if (result.error) throw new Error("provider_legal_event_save_failed");
}
