"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { escapeHtml, sendAdminNotifications } from "@/lib/server/notifications";

export type EnquiryState = { message: string; code?: string };
const text = (form: FormData, name: string) =>
  String(form.get(name) || "").trim();
const allowed = {
  customerType: [
    "letting_agent",
    "property_manager",
    "airbnb_operator",
    "serviced_accommodation",
    "portfolio_landlord",
    "office_business",
    "block_manager",
    "commercial_operator",
    "other",
  ],
  cleaningType: [
    "recurring_property",
    "airbnb_turnover",
    "end_of_tenancy",
    "office",
    "communal_area",
    "deep_clean",
    "property_turnaround",
    "mixed",
  ],
  frequency: [
    "one_off_managed",
    "weekly",
    "fortnightly",
    "monthly",
    "multiple_weekly",
    "to_discuss",
  ],
  timeframe: [
    "within_2_weeks",
    "within_1_month",
    "within_3_months",
    "planning",
  ],
};

export async function submitBusinessEnquiry(
  _state: EnquiryState,
  form: FormData,
): Promise<EnquiryState> {
  if (text(form, "website")) redirect("/business/enquire/thank-you");
  const payload = {
    idempotency_key: text(form, "idempotencyKey"),
    contact_name: text(form, "name"),
    organisation_name: text(form, "organisation"),
    role_title: text(form, "role"),
    email: text(form, "email").toLowerCase(),
    phone: text(form, "phone"),
    customer_type: text(form, "customerType"),
    site_count: Number(text(form, "siteCount")),
    operating_area: text(form, "area"),
    cleaning_type: text(form, "cleaningType"),
    expected_frequency: text(form, "frequency"),
    start_timeframe: text(form, "timeframe"),
    notes: text(form, "notes") || null,
  };
  if (
    !/^[0-9a-f-]{36}$/i.test(payload.idempotency_key) ||
    payload.contact_name.length < 2 ||
    payload.organisation_name.length < 2 ||
    payload.role_title.length < 2 ||
    !/^\S+@\S+\.\S+$/.test(payload.email) ||
    payload.phone.length < 7 ||
    !Number.isInteger(payload.site_count) ||
    payload.site_count < 1 ||
    payload.operating_area.length < 2 ||
    !allowed.customerType.includes(payload.customer_type) ||
    !allowed.cleaningType.includes(payload.cleaning_type) ||
    !allowed.frequency.includes(payload.expected_frequency) ||
    !allowed.timeframe.includes(payload.start_timeframe)
  ) {
    return {
      message:
        "Check the highlighted details and complete every required field.",
      code: "validation",
    };
  }
  const db = createSupabaseAdminClient();
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const sourceHash = createHash("sha256").update(`${forwarded}:${process.env.SUPABASE_SERVICE_ROLE_KEY || "quickola"}`).digest("hex");
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [{ count: emailAttempts }, { count: ipAttempts }] = await Promise.all([
    db.from("business_enquiries").select("id", { count: "exact", head: true }).eq("email", payload.email).gte("created_at", windowStart),
    db.from("business_enquiries").select("id", { count: "exact", head: true }).eq("source_ip_hash", sourceHash).gte("created_at", windowStart),
  ]);
  if ((emailAttempts || 0) >= 3 || (ipAttempts || 0) >= 8) return { message: "Too many enquiries were submitted recently. Please try again later.", code: "rate_limit" };
  const { data: existing } = await db
    .from("business_enquiries")
    .select("id")
    .eq("idempotency_key", payload.idempotency_key)
    .maybeSingle();
  if (existing)
    redirect(
      `/business/enquire/thank-you?reference=${existing.id.slice(0, 8).toUpperCase()}`,
    );
  const { data: enquiry, error } = await db
    .from("business_enquiries")
    .insert({ ...payload, source_ip_hash: sourceHash })
    .select("id")
    .single();
  if (error || !enquiry) {
    console.error("business_enquiry_save_failed", {
      code: error?.code || "missing_row",
    });
    return {
      message:
        "We could not save your enquiry. Your details are still here—please try again.",
      code: "save",
    };
  }
  const alert = await sendAdminNotifications({
    telegramHtml: [
      "🏢 <b>New business cleaning enquiry</b>",
      `Organisation: <b>${escapeHtml(payload.organisation_name)}</b>`,
      `Contact: ${escapeHtml(payload.contact_name)}`,
      `Email: ${escapeHtml(payload.email)}`,
      `Area: ${escapeHtml(payload.operating_area)}`,
      `Sites: ${payload.site_count}`,
      `Cleaning: ${escapeHtml(payload.cleaning_type.replaceAll("_", " "))}`,
    ].join("\n"),
  });
  await db
    .from("business_enquiries")
    .update({
      notification_status: alert.telegramSent ? "sent" : "failed",
      notification_error: alert.telegramSent
        ? null
        : "operational_alert_failed",
    })
    .eq("id", enquiry.id);
  redirect(
    `/business/enquire/thank-you?reference=${enquiry.id.slice(0, 8).toUpperCase()}`,
  );
}
