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
    const postcode = formatPostcode(String(body.postcode || ""));

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
        { error: "QuickOla only supports SL1, SL2 and SL3 postcodes right now." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("requests")
      .insert({
        service,
        area: "slough",
        postcode,
        status: "price_check_started",
        source: "homepage_cumar",
        cumar_mode: process.env.CUMAR_MODE || "rules",
        cumar_status: "captured",
        ready_for_pol: false,
        raw_payload: body,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Cumar intake insert error:", error);

      return NextResponse.json(
        { error: "Could not save request." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      request_id: data.id,
      service,
      postcode,
    });
  } catch (error) {
    console.error("Cumar intake route error:", error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}