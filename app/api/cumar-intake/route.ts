import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { escapeHtml, sendAdminNotifications } from "@/lib/server/notifications";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

function isRateLimited(key: string) {
  const now = Date.now();
  const current = requestBuckets.get(key);
  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

function normalisePostcode(value: string) {
  return value.toUpperCase().replace(/\s+/g, "").trim();
}

function formatPostcode(value: string) {
  const clean = normalisePostcode(value);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, -3)} ${clean.slice(-3)}`;
}

function isValidUkPostcode(value: string) {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(
    value.trim().toUpperCase()
  );
}

function isSupportedSloughPostcode(value: string) {
  const clean = normalisePostcode(value);
  return /^SL[1-6][A-Z]?\d[A-Z]{2}$/.test(clean);
}

function getAreaFromPostcode(value: string) {
  const clean = normalisePostcode(value);

  if (clean.startsWith("SL1")) return "slough";
  if (clean.startsWith("SL2")) return "slough";
  if (clean.startsWith("SL3")) return "slough";
  if (clean.startsWith("SL4")) return "slough-nearby";
  if (clean.startsWith("SL5")) return "slough-nearby";
  if (clean.startsWith("SL6")) return "slough-nearby";

  return "slough";
}

function getFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function cleanPhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

function humaniseValue(value: string) {
  const knownLabels: Record<string, string> = {
    "regular-clean": "Regular clean",
    "deep-clean": "Deep clean",
    "end-of-tenancy": "End of tenancy",
    "airbnb-short-let": "Airbnb / short-let",
    "after-builders": "After builders",
    studio: "Studio",
    "1-bed": "1 bedroom",
    "2-bed": "2 bedroom",
    "3-bed": "3 bedroom",
    "4-bed-plus": "4+ bedroom",
    "not-sure": "Not sure",
  };

  return knownLabels[value] ?? value.replace(/-/g, " ");
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (isRateLimited(forwardedFor || "unknown")) {
      return NextResponse.json({ error: "Too many requests. Please wait a few minutes and try again." }, { status: 429 });
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (String(body.website || "").trim()) {
      return NextResponse.json({ error: "Request blocked." }, { status: 400 });
    }

    const service = String(body.service || "").trim();
    const serviceLabel = String(body.service_label || service).trim();
    const postcode = formatPostcode(String(body.postcode || ""));
    const source = String(body.source || "homepage_cumar").trim();
    const cumarMode = String(
      body.cumar_mode || process.env.CUMAR_MODE || "rules"
    ).trim();
    const isLocalHelper = service === "local-helper";
    const providerLane = String(
      body.provider_lane || (isLocalHelper ? "local_helper" : "local_business")
    ).trim();
    const jobSize = String(body.job_size || (isLocalHelper ? "small" : "normal")).trim();
    const jobRisk = String(body.job_risk || (isLocalHelper ? "low" : "medium")).trim();
    const customerBudgetRaw = String(body.customer_budget || "").trim();
    const customerBudget = customerBudgetRaw ? Number(customerBudgetRaw) : null;
    const budgetNote = String(body.budget_note || "").trim();

    const serviceDetails = body.service_details && typeof body.service_details === "object" ? body.service_details : {};
    const customerPhone = cleanPhone(
      getFirstString(
        body.customer_phone,
        body.phone,
        body.customerPhone,
        body.phone_number,
        (serviceDetails as Record<string, unknown>).phone,
        (serviceDetails as Record<string, unknown>).customer_phone
      )
    );
    const cleanType = getFirstString(body.clean_type, (serviceDetails as Record<string, unknown>).cleanType);
    const cleanFrequency = getFirstString(body.clean_frequency, (serviceDetails as Record<string, unknown>).cleanFrequency);
    const bedrooms = getFirstString(body.job_size, (serviceDetails as Record<string, unknown>).bedrooms);
    const notes = getFirstString(body.notes, (serviceDetails as Record<string, unknown>).notes);
    const sourcePage = getFirstString(body.source_page, (serviceDetails as Record<string, unknown>).sourcePage);
    const customerName = getFirstString(body.customer_name, (serviceDetails as Record<string, unknown>).name);
    const customerEmail = getFirstString(body.customer_email, (serviceDetails as Record<string, unknown>).email);
    const businessName = getFirstString((serviceDetails as Record<string, unknown>).business);
    const bookingAddress = getFirstString((serviceDetails as Record<string, unknown>).address);
    const requestedDate = getFirstString((serviceDetails as Record<string, unknown>).date, (serviceDetails as Record<string, unknown>).startDate);
    const requestedTime = getFirstString((serviceDetails as Record<string, unknown>).time);
    const quoteStage = getFirstString(body.quote_stage);

    if (customerPhone && !/^(?:\+44|0)(?:7\d{9}|\d{9,10})$/.test(customerPhone)) {
      return NextResponse.json({ error: "Enter a valid UK contact number." }, { status: 400 });
    }

    if (customerEmail && !/^\S+@\S+\.\S+$/.test(customerEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (notes.length > 3000) {
      return NextResponse.json({ error: "Please shorten the notes to 3,000 characters or fewer." }, { status: 400 });
    }

    if (quoteStage === "booking_requested" && (!customerName || !customerEmail || !customerPhone || !bookingAddress || !requestedDate || !requestedTime)) {
      return NextResponse.json({ error: "Complete all required booking details." }, { status: 400 });
    }

    if (quoteStage === "commercial_contract_enquiry") {
      const units = Number((serviceDetails as Record<string, unknown>).sites || 0);
      if (!customerName || !customerEmail || !customerPhone || !businessName || !requestedDate || units < 1 || notes.length < 20) {
        return NextResponse.json({ error: "Complete all required contract enquiry details." }, { status: 400 });
      }
    }

    if (!service) {
      return NextResponse.json(
        { error: "Service is required." },
        { status: 400 }
      );
    }

    if (!postcode) {
      return NextResponse.json(
        { error: "Postcode is required." },
        { status: 400 }
      );
    }

    if (!isValidUkPostcode(postcode)) {
      return NextResponse.json(
        { error: "Enter a valid UK postcode." },
        { status: 400 }
      );
    }

    if (!isSupportedSloughPostcode(postcode)) {
      return NextResponse.json(
        {
          error:
            "Quickola only supports Slough and nearby SL1–SL6 postcodes right now.",
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const area = getAreaFromPostcode(postcode);

    const { data, error } = await supabase
      .from("requests")
      .insert({
        service,
        area,
        postcode,
        status: customerPhone ? "new_cleaner_enquiry" : "price_check_started",
        source,
        phone: customerPhone || null,
        email: customerEmail || null,
        time_needed: requestedDate ? [requestedDate, requestedTime].filter(Boolean).join(" · ") : "not_given_yet",
        details: [
          `${serviceLabel} in ${postcode}.`,
          bookingAddress ? `Address: ${bookingAddress}` : "",
          notes ? `Notes: ${notes}` : "",
        ].filter(Boolean).join("\n"),
        cumar_mode: cumarMode,
        cumar_status: "captured",
        provider_lane: providerLane,
        job_size: jobSize,
        job_risk: jobRisk,
        customer_budget: Number.isFinite(customerBudget) ? customerBudget : null,
        budget_note: budgetNote || null,
        ready_for_pol: false,
        missing_fields: customerPhone
          ? requestedDate ? [] : ["time_needed"]
          : isLocalHelper
            ? ["task_details", "time_needed", "contact"]
            : ["job_details", "time_needed", "contact"],
        raw_payload: {
          ...body,
          service,
          service_label: serviceLabel,
          postcode,
          source,
          cumar_mode: cumarMode,
          provider_lane: providerLane,
          job_size: jobSize,
          job_risk: jobRisk,
          customer_budget: Number.isFinite(customerBudget) ? customerBudget : null,
          budget_note: budgetNote || null,
          customer_phone: customerPhone || null,
          clean_type: cleanType || null,
          clean_frequency: cleanFrequency || null,
          bedrooms: bedrooms || null,
          notes: notes || null,
          source_page: sourcePage || null,
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("Cumar intake insert error:", error);

      return NextResponse.json(
        { error: "Could not save your price check." },
        { status: 500 }
      );
    }

    const isCommercial = service === "commercial-cleaning";
    const telegramLines = [
      isCommercial ? "🏢 <b>New Quickola contract enquiry</b>" : "🧼 <b>New Quickola cleaning booking</b>",
      `Request ID: <code>${escapeHtml(String(data.id))}</code>`,
      `Service: <b>${escapeHtml(serviceLabel || service)}</b>`,
      cleanType ? `Clean type: <b>${escapeHtml(humaniseValue(cleanType))}</b>` : "",
      bedrooms ? `Property size: <b>${escapeHtml(humaniseValue(bedrooms))}</b>` : "",
      `Postcode: <b>${escapeHtml(postcode)}</b>`,
      customerPhone ? `Phone: ${escapeHtml(customerPhone)}` : "Phone: not provided",
      customerName ? `Name: <b>${escapeHtml(customerName)}</b>` : "",
      businessName ? `Business: <b>${escapeHtml(businessName)}</b>` : "",
      customerEmail ? `Email: ${escapeHtml(customerEmail)}` : "",
      notes ? `Notes: ${escapeHtml(notes)}` : "",
      sourcePage ? `Page: ${escapeHtml(sourcePage)}` : `Source: ${escapeHtml(source)}`,
    ].filter(Boolean);

    const notificationResult = await sendAdminNotifications({
      telegramHtml: telegramLines.join("\n"),
    });

    if (!notificationResult.telegramSent) {
      console.error("Intake notification delivery failed:", notificationResult.errors);
    }

    return NextResponse.json({
      request_id: data.id,
      service,
      service_label: serviceLabel,
      postcode,
      area,
      cumar_mode: cumarMode,
      provider_lane: providerLane,
      job_size: jobSize,
      job_risk: jobRisk,
      ready_for_pol: false,
      customer_phone_captured: Boolean(customerPhone),
      notification_sent: notificationResult.telegramSent,
    });
  } catch (error) {
    console.error("Cumar intake route error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
