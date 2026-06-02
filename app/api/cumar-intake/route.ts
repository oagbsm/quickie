

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  return /^SL[123][A-Z]?\d[A-Z]{2}$/.test(clean);
}

function getAreaFromPostcode(value: string) {
  const clean = normalisePostcode(value);

  if (clean.startsWith("SL1")) return "slough";
  if (clean.startsWith("SL2")) return "slough";
  if (clean.startsWith("SL3")) return "slough";

  return "slough";
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
            "QuickOla only supports SL1, SL2 and SL3 postcodes right now.",
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
        status: "price_check_started",
        source,
        time_needed: "not_given_yet",
        details: `Cumar price check started for ${serviceLabel} in ${postcode}.`,
        cumar_mode: cumarMode,
        cumar_status: "captured",
        provider_lane: providerLane,
        job_size: jobSize,
        job_risk: jobRisk,
        customer_budget: Number.isFinite(customerBudget) ? customerBudget : null,
        budget_note: budgetNote || null,
        ready_for_pol: false,
        missing_fields: isLocalHelper
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
    });
  } catch (error) {
    console.error("Cumar intake route error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}