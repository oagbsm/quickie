import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

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

function escapeTelegramHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendTelegramMessage(message: string) {
  if (!telegramBotToken || !telegramChatId) {
    console.warn("Telegram env vars missing: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: telegramChatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram send failed: ${response.status} ${text}`);
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    const body = await request.json();

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
        time_needed: "not_given_yet",
        details: customerPhone
          ? `Cleaner enquiry for ${serviceLabel} in ${postcode}. Phone: ${customerPhone}.`
          : `Cumar price check started for ${serviceLabel} in ${postcode}.`,
        cumar_mode: cumarMode,
        cumar_status: "captured",
        provider_lane: providerLane,
        job_size: jobSize,
        job_risk: jobRisk,
        customer_budget: Number.isFinite(customerBudget) ? customerBudget : null,
        budget_note: budgetNote || null,
        ready_for_pol: false,
        missing_fields: customerPhone
          ? ["time_needed"]
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

    const telegramLines = [
      "🧼 <b>New Quickola cleaner request</b>",
      `Request ID: <code>${escapeTelegramHtml(String(data.id))}</code>`,
      `Service: <b>${escapeTelegramHtml(serviceLabel || service)}</b>`,
      cleanType ? `Clean type: <b>${escapeTelegramHtml(humaniseValue(cleanType))}</b>` : "",
      bedrooms ? `Property size: <b>${escapeTelegramHtml(humaniseValue(bedrooms))}</b>` : "",
      `Postcode: <b>${escapeTelegramHtml(postcode)}</b>`,
      customerPhone ? `Phone: <a href="tel:${escapeTelegramHtml(customerPhone)}">${escapeTelegramHtml(customerPhone)}</a>` : "Phone: not provided",
      notes ? `Notes: ${escapeTelegramHtml(notes)}` : "",
      sourcePage ? `Page: ${escapeTelegramHtml(sourcePage)}` : `Source: ${escapeTelegramHtml(source)}`,
    ].filter(Boolean);

    try {
      await sendTelegramMessage(telegramLines.join("\n"));
    } catch (telegramError) {
      console.error("Cumar Telegram alert error:", telegramError);
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
    });
  } catch (error) {
    console.error("Cumar intake route error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}