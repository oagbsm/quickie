"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getAdminAlertEmails() {
  return [
    process.env.ADMIN_ALERT_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.CONTACT_EMAIL,
  ]
    .filter(Boolean)
    .join(",");
}

async function sendEmailOrLog({
  subject,
  text,
}: {
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = getAdminAlertEmails();
  const fromEmail = process.env.FROM_EMAIL || "Quickola <onboarding@resend.dev>";

  if (!apiKey || !adminEmail) {
    console.error("Quickola email skipped: missing email env vars.", {
      hasResendApiKey: Boolean(apiKey),
      adminEmail,
      hasAdminAlertEmail: Boolean(process.env.ADMIN_ALERT_EMAIL),
      hasAdminEmail: Boolean(process.env.ADMIN_EMAIL),
      hasContactEmail: Boolean(process.env.CONTACT_EMAIL),
      fromEmail,
      subject,
    });
    return;
  }

  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject,
    text,
  });

  if (result.error) {
    console.error("Quickola email failed:", {
      subject,
      to: adminEmail,
      from: fromEmail,
      error: result.error,
    });
    return;
  }

  console.log("Quickola email sent:", {
    subject,
    to: adminEmail,
    id: result.data?.id,
  });
}

async function sendAdminRequestAlert({
  service,
  area,
  postcode,
  timeNeeded,
  email,
  phone,
  details,
}: {
  service: string;
  area: string;
  postcode?: string;
  timeNeeded: string;
  email: string;
  phone?: string | null;
  details: string;
}) {
  try {
    const displayService = service.replace(/-/g, " ");
    const displayArea = area.replace(/-/g, " ");

    await sendEmailOrLog({
      subject: `New Quickola request: ${displayService} in ${displayArea}`,
      text: `
New Quickola request

Service: ${displayService}
Location: ${displayArea}
Postcode: ${postcode || "Not provided"}
Needed: ${timeNeeded.replace(/-/g, " ")}

Customer email: ${email}
Phone: ${phone || "Not provided"}

Details:
${details || "No details"}

Open admin:
${process.env.NEXT_PUBLIC_SITE_URL || "https://quickola.co.uk"}/qk-ops-7f3a
      `.trim(),
    });
  } catch (error) {
    console.error("Failed to send admin request alert:", error);
  }
}

async function sendAdminBusinessAlert({
  businessName,
  category,
  whatsapp,
  startingPrice,
  availability,
  profileSlug,
  description,
  areas,
  source,
}: {
  businessName: string;
  category: string;
  whatsapp: string;
  startingPrice?: string | number | null;
  availability?: string | null;
  profileSlug?: string | null;
  description?: string | null;
  areas: string[];
  source: string;
}) {
  try {
    const displayCategory = category.replace(/-/g, " ");
    const displayAreas = areas.length ? areas.join(", ") : "Not provided";

    await sendEmailOrLog({
      subject: `New Quickola provider application: ${businessName || "Unnamed business"}`,
      text: `
New Quickola provider application

Business: ${businessName || "Not provided"}
Service: ${displayCategory || "Not provided"}
WhatsApp: ${whatsapp || "Not provided"}
Starting price: ${startingPrice || "Not provided"}
Availability: ${availability || "Not provided"}
Areas: ${displayAreas}
Profile slug: ${profileSlug || "Not provided"}
Source: ${source || "Not provided"}

Description:
${description || "No description"}

Action:
Review this provider in admin, then approve, reject or contact them.

Open admin:
${process.env.NEXT_PUBLIC_SITE_URL || "https://quickola.co.uk"}/qk-ops-7f3a
      `.trim(),
    });
  } catch (error) {
    console.error("Failed to send admin business alert:", error);
  }
}

export async function createRequest(formData: FormData) {
  const service = clean(formData.get("service")) || "cleaner";
  const area = clean(formData.get("area")) || "slough";
  const postcode = clean(formData.get("postcode")).toUpperCase();
  const details = clean(formData.get("details"));
  const phone = clean(formData.get("phone"));
  const email = clean(formData.get("email"));
  const timeNeeded = clean(formData.get("time_needed")) || "today";

  const requestPayload = {
    service,
    area,
    postcode: postcode || null,
    details,
    phone,
    email,
    time_needed: timeNeeded,
    status: "new",
    source: "website",
  };

  let { error } = await supabase.from("requests").insert(requestPayload);

  if (error && error.message.toLowerCase().includes("email")) {
    const { email: _email, ...requestPayloadWithoutEmail } = requestPayload;
    const retry = await supabase.from("requests").insert(requestPayloadWithoutEmail);
    error = retry.error;
  }

  if (error) {
    console.error("Failed to create request:", error);
    throw new Error(`Could not save request: ${error.message}`);
  }

  await sendAdminRequestAlert({
    service,
    area,
    postcode,
    timeNeeded,
    email: email || "Not provided",
    phone: phone || null,
    details,
  });

  redirect(
    `/results?service=${encodeURIComponent(service)}&area=${encodeURIComponent(area)}&postcode=${encodeURIComponent(postcode)}&phone=${encodeURIComponent(phone)}&saved=true`
  );
}

export async function createBusiness(formData: FormData) {
  const businessName = clean(formData.get("businessName"));
  const category = clean(formData.get("category"));
  const whatsapp = clean(formData.get("whatsapp"));
  const startingPrice = clean(formData.get("startingPrice"));
  const availability = clean(formData.get("availability"));
  const profileSlug = clean(formData.get("profileSlug"));
  const description = clean(formData.get("description"));
  const areas = formData.getAll("areas").map(String);
  const areasCustom = clean(formData.get("areasCustom"));
  const source = clean(formData.get("source")) || "website";
  const allAreas = [
    ...areas,
    ...areasCustom
      .split(",")
      .map((area) => area.trim().toUpperCase())
      .filter(Boolean),
  ];

  const { error } = await supabase.from("businesses").insert({
    business_name: businessName,
    category,
    whatsapp,
    starting_price: startingPrice ? Number(startingPrice) : null,
    areas: allAreas,
    availability,
    profile_slug: profileSlug,
    description,
    status: "new",
    source,
  });

  if (error) {
    console.error("Failed to create business:", error);
    throw new Error(`Could not save business: ${error.message}`);
  }

  await sendAdminBusinessAlert({
    businessName,
    category,
    whatsapp,
    startingPrice,
    availability,
    profileSlug,
    description,
    areas: allAreas,
    source,
  });

  redirect("/business-success");
}

export async function updateBusinessStatus(formData: FormData) {
  const id = clean(formData.get("id"));
  const status = clean(formData.get("status"));

  if (!id || !status) {
    throw new Error("Missing business id or status.");
  }

  const updateData: {
    status: string;
    approved_at?: string | null;
    rejected_at?: string | null;
  } = { status };

  if (status === "approved") {
    updateData.approved_at = new Date().toISOString();
    updateData.rejected_at = null;
  }

  if (status === "rejected") {
    updateData.rejected_at = new Date().toISOString();
  }

  if (status === "pending" || status === "new") {
    updateData.approved_at = null;
    updateData.rejected_at = null;
  }

  const { error } = await supabase
    .from("businesses")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Failed to update business status:", error);
    throw new Error(`Could not update business: ${error.message}`);
  }

  revalidatePath("/qk-ops-7f3a");
}

export async function updateRequestStatus(formData: FormData) {
  const id = clean(formData.get("id"));
  const status = clean(formData.get("status"));

  if (!id || !status) {
    throw new Error("Missing request id or status.");
  }

  const { data: existingRequest, error: readError } = await supabase
    .from("requests")
    .select("id, status, matched_business_id")
    .eq("id", id)
    .single();

  if (readError) {
    console.error("Failed to read request before status update:", readError);
    throw new Error(`Could not read request: ${readError.message}`);
  }

  const wasCompleted = existingRequest.status === "completed";
  const willBeCompleted = status === "completed";
  const matchedBusinessId = existingRequest.matched_business_id as string | null;

  const updateData: {
    status: string;
    completed_at?: string | null;
  } = { status };

  if (willBeCompleted) {
    updateData.completed_at = new Date().toISOString();
  }

  if (!willBeCompleted) {
    updateData.completed_at = null;
  }

  const { error } = await supabase
    .from("requests")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Failed to update request status:", error);
    throw new Error(`Could not update request: ${error.message}`);
  }

  if (matchedBusinessId && wasCompleted !== willBeCompleted) {
    const { data: business, error: businessReadError } = await supabase
      .from("businesses")
      .select("id, completed_jobs")
      .eq("id", matchedBusinessId)
      .single();

    if (businessReadError) {
      console.error("Failed to read matched business:", businessReadError);
      throw new Error(`Could not update completed jobs: ${businessReadError.message}`);
    }

    const currentCompletedJobs = Number(business.completed_jobs || 0);
    const nextCompletedJobs = willBeCompleted
      ? currentCompletedJobs + 1
      : Math.max(0, currentCompletedJobs - 1);

    const { error: businessUpdateError } = await supabase
      .from("businesses")
      .update({ completed_jobs: nextCompletedJobs })
      .eq("id", matchedBusinessId);

    if (businessUpdateError) {
      console.error("Failed to update completed jobs:", businessUpdateError);
      throw new Error(`Could not update completed jobs: ${businessUpdateError.message}`);
    }
  }

  revalidatePath("/qk-ops-7f3a");
}

export async function matchRequestToBusiness(formData: FormData) {
  const requestId = clean(formData.get("request_id"));
  const businessId = clean(formData.get("business_id"));

  if (!requestId || !businessId) {
    throw new Error("Missing request id or business id.");
  }

  const { error } = await supabase
    .from("requests")
    .update({
      matched_business_id: businessId,
      status: "matched",
    })
    .eq("id", requestId);

  if (error) {
    console.error("Failed to match request:", error);
    throw new Error(`Could not match request: ${error.message}`);
  }

  revalidatePath("/qk-ops-7f3a");
}

export async function deleteRequest(formData: FormData) {
  const id = clean(formData.get("id"));

  if (!id) {
    throw new Error("Missing request id.");
  }

  const { error } = await supabase.from("requests").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete request:", error);
    throw new Error(`Could not delete request: ${error.message}`);
  }

  revalidatePath("/qk-ops-7f3a");
}


export async function deleteBusiness(formData: FormData) {
  const id = clean(formData.get("id"));

  if (!id) {
    throw new Error("Missing business id.");
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      active: false,
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to archive business:", error);
    throw new Error(`Could not archive business: ${error.message}`);
  }

  revalidatePath("/qk-ops-7f3a");
}

export async function addProvider(formData: FormData) {
  const businessName = clean(formData.get("business_name"));
  const category = clean(formData.get("category"));
  const whatsapp = clean(formData.get("whatsapp"));
  const startingPriceRaw = clean(formData.get("starting_price"));
  const areasRaw = clean(formData.get("areas"));
  const availability = clean(formData.get("availability"));
  const description = clean(formData.get("description"));

  if (!businessName || !category || !whatsapp) {
    throw new Error("Business name, service and WhatsApp are required.");
  }

  const areas = areasRaw
    ? areasRaw
        .split(",")
        .map((area) => area.trim().toUpperCase())
        .filter(Boolean)
    : [];

  const parsedStartingPrice = startingPriceRaw ? Number(startingPriceRaw) : null;

  const { error } = await supabase.from("businesses").insert({
    business_name: businessName,
    category,
    whatsapp,
    starting_price: Number.isFinite(parsedStartingPrice) ? parsedStartingPrice : null,
    areas,
    availability: availability || null,
    description: description || null,
    status: "approved",
    source: "manual",
    approved_at: new Date().toISOString(),
    active: true,
    trust_score: 60,
    verification_status: "manually_checked",
    verification_notes: "Added manually from admin provider form.",
    accepts_whatsapp_alerts: true,
  });

  if (error) {
    console.error("Failed to add provider:", error);
    throw new Error(`Could not add provider: ${error.message}`);
  }

  await sendAdminBusinessAlert({
    businessName,
    category,
    whatsapp,
    startingPrice: startingPriceRaw,
    availability,
    profileSlug: null,
    description,
    areas,
    source: "manual-admin",
  });

  revalidatePath("/qk-ops-7f3a");
}

export async function updateAdminNotes(formData: FormData) {
  const id = clean(formData.get("id"));
  const table = clean(formData.get("table"));
  const notes = clean(formData.get("notes"));

  if (!id || !table) {
    throw new Error("Missing id or table.");
  }

  if (table !== "requests" && table !== "businesses") {
    throw new Error("Invalid table.");
  }

  const column = table === "requests" ? "admin_notes" : "internal_notes";

  const { error } = await supabase
    .from(table)
    .update({ [column]: notes })
    .eq("id", id);

  if (error) {
    console.error("Failed to update notes:", error);
    throw new Error(`Could not update notes: ${error.message}`);
  }

  revalidatePath("/qk-ops-7f3a");
}

export async function createAdminRequest(formData: FormData) {
  const service = clean(formData.get("service"));
  const area = clean(formData.get("area"));
  const postcode = clean(formData.get("postcode")).toUpperCase();
  const details = clean(formData.get("details"));
  const phone = clean(formData.get("phone"));
  const timeNeeded = clean(formData.get("time_needed")) || "today";

  if (!service || !area) {
    throw new Error("Service and area are required.");
  }

  const { error } = await supabase.from("requests").insert({
    service,
    area,
    postcode: postcode || null,
    details,
    phone,
    time_needed: timeNeeded,
    status: "new",
    source: "admin",
  });

  if (error) {
    console.error("Failed to create admin request:", error);
    throw new Error(`Could not create request: ${error.message}`);
  }

  await sendAdminRequestAlert({
    service,
    area,
    postcode,
    timeNeeded,
    email: "Admin-created request",
    phone: phone || null,
    details,
  });

  revalidatePath("/qk-ops-7f3a");
}

export async function saveCheckPriceRequest(formData: FormData) {
  const service = clean(formData.get("service")) || "cleaning";
  const area = clean(formData.get("area")) || "slough";
  const postcode = clean(formData.get("postcode")).toUpperCase();
  const jobType = clean(formData.get("job_type"));
  const jobDetail = clean(formData.get("job_detail"));
  const timeNeeded = clean(formData.get("time_needed")) || "this-week";
  const email = clean(formData.get("email"));
  const phone = clean(formData.get("phone"));
  const phoneLooksValid = !phone || /^07[0-9]{9}$/.test(phone);

  if (!phoneLooksValid) {
    throw new Error("Please enter an 11-digit UK mobile number starting with 07, or leave it blank.");
  }

  const source = clean(formData.get("source")) || "check-price";

  if (!email) {
    throw new Error("Email is required.");
  }

  const details = [
    jobType ? `Job type: ${jobType}` : "",
    jobDetail ? `Job detail: ${jobDetail}` : "",
    postcode ? `Postcode: ${postcode}` : "",
    timeNeeded ? `Time needed: ${timeNeeded}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const requestPayload = {
    service,
    area,
    postcode: postcode || null,
    details,
    phone: phone || null,
    email,
    time_needed: timeNeeded,
    status: "new",
    source,
  };

  let { error } = await supabase.from("requests").insert(requestPayload);

  if (error && error.message.toLowerCase().includes("email")) {
    const { email: _email, ...requestPayloadWithoutEmail } = requestPayload;
    const retry = await supabase.from("requests").insert(requestPayloadWithoutEmail);
    error = retry.error;
  }

  if (error) {
    console.error("Failed to save check-price request:", error);
    throw new Error(`Could not save request: ${error.message}`);
  }

  await sendAdminRequestAlert({
    service,
    area,
    postcode,
    timeNeeded,
    email,
    phone,
    details,
  });

  const params = new URLSearchParams({
    service,
    area,
    postcode,
    job_type: jobType,
    job_detail: jobDetail,
    time_needed: timeNeeded,
    email,
  });

  if (phone) {
    params.set("phone", phone);
  }

  redirect(`/results?${params.toString()}`);
}
