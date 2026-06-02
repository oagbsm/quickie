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

function buildDetails({
  service,
  jobType,
  jobDetail,
  timeNeeded,
}: {
  service: string;
  jobType: string;
  jobDetail: string;
  timeNeeded: string;
}) {
  return [
    `Service: ${service}`,
    `Job type: ${jobType || "not given"}`,
    `Job detail: ${jobDetail || "not given"}`,
    `Time needed: ${timeNeeded || "not given"}`,
  ].join("\n");
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

    const requestId = String(body.request_id || "").trim();
    const service = String(body.service || "").trim();
    const postcode = formatPostcode(String(body.postcode || ""));
    const jobType = String(body.job_type || "").trim();
    const jobDetail = String(body.job_detail || "").trim();
    const timeNeeded = String(body.time_needed || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const source = String(body.source || "cumar_complete").trim();

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required." },
        { status: 400 }
      );
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
            "QuickOla only supports SL1, SL2 and SL3 postcodes right now.",
        },
        { status: 400 }
      );
    }

    if (!jobType) {
      return NextResponse.json(
        { error: "Choose what job you need." },
        { status: 400 }
      );
    }

    if (!jobDetail) {
      return NextResponse.json(
        { error: "Choose the job detail." },
        { status: 400 }
      );
    }

    if (!timeNeeded) {
      return NextResponse.json(
        { error: "Choose when you need it." },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Enter your email or WhatsApp number." },
        { status: 400 }
      );
    }

    if (phone && !/^07\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter an 11-digit UK mobile number starting with 07." },
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
    const details = buildDetails({ service, jobType, jobDetail, timeNeeded });

    const { data, error } = await supabase
      .from("requests")
      .update({
        service,
        area,
        postcode,
        details,
        time_needed: timeNeeded,
        email: email || null,
        phone: phone || null,
        source,
        status: "ready_for_pol",
        cumar_status: "completed",
        cumar_notes:
          "Cumar completed missing request details on the check-price page.",
        ready_for_pol: true,
        pol_status: "waiting",
        missing_fields: [],
        raw_payload: {
          ...body,
          request_id: requestId,
          service,
          postcode,
          area,
          job_type: jobType,
          job_detail: jobDetail,
          time_needed: timeNeeded,
          email: email || null,
          phone: phone || null,
          source,
        },
      })
      .eq("id", requestId)
      .select("id, service, postcode, status, ready_for_pol")
      .single();

    if (error) {
      console.error("Cumar complete update error:", error);

      return NextResponse.json(
        { error: "Could not complete your request." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      request_id: data.id,
      service: data.service,
      postcode: data.postcode,
      status: data.status,
      ready_for_pol: data.ready_for_pol,
    });
  } catch (error) {
    console.error("Cumar complete route error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}