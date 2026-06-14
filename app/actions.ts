
"use server";
import crypto from "crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanUpperList(values: FormDataEntryValue[]) {
  return values
    .map(String)
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
}

function cleanCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function cleanServiceList(values: FormDataEntryValue[], fallbackService: string) {
  const services = values
    .map(String)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (fallbackService && !services.includes(fallbackService)) {
    services.unshift(fallbackService);
  }

  return Array.from(new Set(services));
}

function getPostcodeDistrict(value: string) {
  const cleanValue = value.toUpperCase().replace(/\s+/g, "").trim();
  const match = cleanValue.match(/^([A-Z]{1,2}\d[A-Z\d]?)/);
  return match ? match[1] : "";
}



function toNumberOrNull(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const REQUEST_PHOTO_BUCKET = "request-photos";
const MAX_REQUEST_PHOTOS = 5;
const MAX_REQUEST_PHOTO_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_REQUEST_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function getRequestPhotoExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/heic") return "heic";
  if (file.type === "image/heif") return "heif";
  return "jpg";
}

async function uploadRequestPhotos({
  formData,
  requestId,
}: {
  formData: FormData;
  requestId: string;
}) {
  const photoFiles = formData
    .getAll("photos")
    .filter((entry): entry is File => {
      if (!entry || typeof entry !== "object") return false;

      const maybeFile = entry as File;

      return (
        typeof maybeFile.arrayBuffer === "function" &&
        typeof maybeFile.size === "number" &&
        maybeFile.size > 0 &&
        typeof maybeFile.type === "string"
      );
    })
    .slice(0, MAX_REQUEST_PHOTOS);

  if (!photoFiles.length) {
    return [];
  }

  const supabaseAdmin = getSupabaseAdmin();
  const uploadedPaths: string[] = [];

  for (const [index, file] of photoFiles.entries()) {
    if (!ALLOWED_REQUEST_PHOTO_TYPES.has(file.type)) {
      throw new Error("Please upload JPG, PNG, WEBP, HEIC or HEIF images only.");
    }

    if (file.size > MAX_REQUEST_PHOTO_SIZE_BYTES) {
      throw new Error("Each photo must be under 4MB. Please upload a smaller photo.");
    }

    const extension = getRequestPhotoExtension(file);
    const storagePath = `${requestId}/photo-${index + 1}-${Date.now()}.${extension}`;

    const { error } = await supabaseAdmin.storage
      .from(REQUEST_PHOTO_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Failed to upload request photo:", error);
      throw new Error(`Could not upload photo: ${error.message}`);
    }

    uploadedPaths.push(storagePath);
  }

  return uploadedPaths;
}


function getRequestLane(service: string) {
  const highRiskServices = new Set([
    "plumbing",
    "emergency-plumber",
    "electrician",
    "boiler-repair",
    "locksmith",
    "roof-repair",
    "pest-control",
    "appliance-repair",
    "mot-car-repairs",
  ]);

  if (service === "local-helper") {
    return {
      providerLane: "local_helper",
      jobSize: "small",
      jobRisk: "low",
    };
  }

  if (highRiskServices.has(service)) {
    return {
      providerLane: "verified_professional",
      jobSize: "normal",
      jobRisk: "high",
    };
  }

  return {
    providerLane: "local_business",
    jobSize: "normal",
    jobRisk: "medium",
  };
}

function getProviderMatchLabel(providerLane: string) {
  if (providerLane === "local_helper") return "local_helper";
  if (providerLane === "verified_professional") return "verified_professional";
  return "local_business";
}


function getProviderContactNote(contactStatus: string) {
  if (contactStatus === "customer_contacted") return "Provider confirmed they called/contacted the customer.";
  if (contactStatus === "customer_no_answer") return "Provider tried to contact the customer, but the customer did not answer.";
  if (contactStatus === "customer_unreachable") return "Provider cannot reach the customer.";
  return "Provider contact update received.";
}

function getProviderJobOutcomeNote(outcome: string) {
  if (outcome === "job_completed") return "Provider marked the job as completed. Zayn should now confirm satisfaction with the customer to improve Quickola quality and provider standards.";
  if (outcome === "customer_cancelled") return "Provider marked the job as cancelled by the customer.";
  if (outcome === "job_not_completed") return "Provider marked the job as not completed. Zayn should review and decide next steps.";
  return "Provider job outcome update received.";
}

function sortProvidersForPol(providers: any[]) {
  return [...providers].sort((a, b) => {
    const aScore = Number(a.provider_score ?? a.trust_score ?? 0);
    const bScore = Number(b.provider_score ?? b.trust_score ?? 0);

    if (bScore !== aScore) return bScore - aScore;

    const aResponse = Number(a.average_response_minutes ?? 999999);
    const bResponse = Number(b.average_response_minutes ?? 999999);

    if (aResponse !== bResponse) return aResponse - bResponse;

    const aJobs = Number(a.completed_jobs ?? 0);
    const bJobs = Number(b.completed_jobs ?? 0);

    return bJobs - aJobs;
  });
}

function formatPolText(value: string | null | undefined) {
  if (!value) return "Not provided";
  return value.replace(/-/g, " ");
}

function extractDetailValue(details: string | null | undefined, label: string) {
  if (!details) return "";
  const line = details
    .split("\n")
    .find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));

  if (!line) return "";
  return line.slice(line.indexOf(":") + 1).trim();
}

function normaliseWhatsappForWaMe(value: string | null | undefined) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("44")) return digits;
  if (digits.startsWith("0")) return `44${digits.slice(1)}`;

  return digits;
}

function buildPolProviderMessage({
  request,
  provider,
  match,
}: {
  request: any;
  provider: any;
  match: any;
}) {
  const service = formatPolText(request.service);
  const jobType = extractDetailValue(request.details, "Job type") || service;
  const jobDetail = extractDetailValue(request.details, "Job detail") || formatPolText(request.job_size);
  const needed = formatPolText(request.time_needed);
  const postcode = request.postcode || "Not provided";
  const guide = match.rough_range || (request.customer_budget ? `Customer budget around £${request.customer_budget}` : "Guide price not provided");
  const minimum = match.minimum_charge ? `Minimum: £${match.minimum_charge}` : "";
  const callout = match.callout_fee ? `Call-out: £${match.callout_fee}` : "";
  const isLocalHelper = request.provider_lane === "local_helper" || request.service === "local-helper";

  if (isLocalHelper) {
    return `Quickola small job.

Task: ${formatPolText(jobType)}
Postcode: ${postcode}
Size: ${formatPolText(jobDetail)}
Needed: ${needed}
Guide: ${guide}${minimum ? `\n${minimum}` : ""}

Reply:
YES £__ TIME __

Example:
YES £40 TODAY 5PM

Or reply:
NO`;
  }

  return `Quickola lead.

Service: ${service}
Issue: ${formatPolText(jobType)}
Postcode: ${postcode}
Needed: ${needed}
${callout ? `${callout}\n` : ""}${minimum ? `${minimum}\n` : ""}Guide: ${guide}

Reply:
YES £CALL_OUT TIME

Example:
YES £80 TODAY 6PM

Or reply:
NO

Final price is confirmed by you after diagnosis, parts, access and job details.`;
}

function buildWhatsappLink(whatsapp: string | null | undefined, message: string) {
  const phone = normaliseWhatsappForWaMe(whatsapp);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function getProviderOfferExpiryMinutes(timeNeeded: string | null | undefined) {
  const value = String(timeNeeded || "").toLowerCase();
  if (value.includes("today") || value.includes("urgent") || value.includes("asap")) return 10;
  return 30;
}

function buildProviderOfferToken() {
  return crypto.randomBytes(24).toString("hex");
}

function buildProviderOfferUrl(token: string) {
  const rawSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    process.env.APP_URL ||
    "https://quickola.co.uk";

  let siteUrl = rawSiteUrl.trim().replace(/\/+$/, "");

  if (
    siteUrl.includes("localhost") ||
    siteUrl.includes("127.0.0.1") ||
    siteUrl.includes("0.0.0.0")
  ) {
    siteUrl = "https://quickola.co.uk";
  }

  return `${siteUrl}/p/provider-offer/${token}`;
}

function buildShortProviderOfferMessage({
  request,
  match,
  providerOfferUrl,
  expiryMinutes,
}: {
  request: any;
  match: any;
  providerOfferUrl: string;
  expiryMinutes: number;
}) {
  const service = formatPolText(request.service);
  const jobType = extractDetailValue(request.details, "Job type") || service;
  const postcode = request.postcode || request.area || "Slough";
  const guide = match.rough_range || "Guide not set";
  const minimum = match.minimum_charge ? `\nMin: £${match.minimum_charge}` : "";
  const needed = formatPolText(request.time_needed);

  return `Quickola customer request.

Task: ${formatPolText(jobType)}
Area: ${postcode}
Guide: ${guide}${minimum}
Needed: ${needed}

If you can help, accept here. The customer contact details will be shown after accepting:
${providerOfferUrl}

Expires in ${expiryMinutes} mins.`;
}

type ParsedProviderReply = {
  status: "accepted" | "rejected" | "needs_more_info" | "unclear";
  quotedPrice: number | null;
  availability: string | null;
  note: string | null;
};

function parseProviderReplyText(rawReply: string): ParsedProviderReply {
  const original = rawReply.trim();
  const upper = original.toUpperCase();

  if (!original) {
    return {
      status: "unclear",
      quotedPrice: null,
      availability: null,
      note: "Empty provider reply.",
    };
  }

  if (/^NO\b|CAN'?T|CANNOT|TOO FAR|NOT AVAILABLE|BUSY/.test(upper)) {
    return {
      status: "rejected",
      quotedPrice: null,
      availability: null,
      note: original,
    };
  }

  if (/PHOTO|PHOTOS|PICTURE|PICTURES|MORE INFO|DETAILS|ADDRESS|CALL ME|CAN YOU SEND|NEED/.test(upper)) {
    return {
      status: "needs_more_info",
      quotedPrice: null,
      availability: null,
      note: original,
    };
  }

  const priceMatch = upper.match(/(?:£|GBP\s*)\s*(\d+(?:\.\d{1,2})?)|\b(\d+(?:\.\d{1,2})?)\s*(?:POUNDS?|QUID)\b/);
  const quotedPrice = priceMatch ? Number(priceMatch[1] || priceMatch[2]) : null;

  const availability = original
    .replace(/YES/gi, "")
    .replace(/ACCEPT/gi, "")
    .replace(/AVAILABLE/gi, "")
    .replace(/CAN DO/gi, "")
    .replace(/(?:£|GBP\s*)\s*\d+(?:\.\d{1,2})?/gi, "")
    .replace(/\b\d+(?:\.\d{1,2})?\s*(?:POUNDS?|QUID)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/^YES\b|ACCEPT|AVAILABLE|CAN DO/.test(upper) || quotedPrice !== null) {
    return {
      status: "accepted",
      quotedPrice,
      availability: availability || null,
      note: original,
    };
  }

  return {
    status: "unclear",
    quotedPrice: null,
    availability: null,
    note: original,
  };
}

function buildCustomerOptionMessageFromReply({
  request,
  parsedReply,
}: {
  request: any;
  parsedReply: ParsedProviderReply;
}) {
  const service = formatPolText(request.service);
  const postcode = request.postcode || request.area || "your area";
  const priceText = parsedReply.quotedPrice !== null ? ` for about £${parsedReply.quotedPrice}` : "";
  const timeText = parsedReply.availability ? ` ${parsedReply.availability}` : "";
  const isLocalHelper = request.provider_lane === "local_helper" || request.service === "local-helper";

  if (isLocalHelper) {
    return `A local helper is available${timeText}${priceText}. Reply YES if you want to continue. Final price depends on exact details and provider confirmation.`;
  }

  return `A ${service} provider is available for ${postcode}${timeText}${priceText}. Reply YES if you want to continue. Final price is confirmed by the provider after diagnosis, parts, access and job details.`;
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

async function sendProviderEmailOrLog({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "Quickola <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.error("Quickola provider email skipped: missing email env vars or provider email.", {
      hasResendApiKey: Boolean(apiKey),
      to,
      fromEmail,
      subject,
    });
    return false;
  }

  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    text,
  });

  if (result.error) {
    console.error("Quickola provider email failed:", {
      subject,
      to,
      from: fromEmail,
      error: result.error,
    });
    return false;
  }

  console.log("Quickola provider email sent:", {
    subject,
    to,
    id: result.data?.id,
  });

  return true;
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
${buildProviderOfferUrl("").replace(/\/p\/provider-offer\/$/, "")}/qk-ops-7f3a
      `.trim(),
    });
  } catch (error) {
    console.error("Failed to send admin request alert:", error);
  }
}
function escapeTelegramHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendTelegramRequestAlert({
  requestId,
  service,
  area,
  postcode,
  timeNeeded,
  email,
  phone,
  details,
  source,
  photoCount = 0,
}: {
  requestId?: string | null;
  service: string;
  area: string;
  postcode?: string | null;
  timeNeeded: string;
  email?: string | null;
  phone?: string | null;
  details: string;
  source?: string | null;
  photoCount?: number;
}) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error("Quickola Telegram skipped: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID.");
      return;
    }

    const adminUrl = `${buildProviderOfferUrl("").replace(/\/p\/provider-offer\/$/, "")}/qk-ops-7f3a`;
    const photoUrl = requestId ? `${adminUrl}/request-photos/${requestId}` : "";
    const displayService = service.replace(/-/g, " ");
    const displayArea = area.replace(/-/g, " ");
    const displayTimeNeeded = timeNeeded.replace(/-/g, " ");

    const message = [
      "🚨 <b>New Quickola Request</b>",
      "",
      `🛠 <b>Service:</b> ${escapeTelegramHtml(displayService)}`,
      `📍 <b>Area:</b> ${escapeTelegramHtml(displayArea)}`,
      postcode ? `📮 <b>Postcode:</b> ${escapeTelegramHtml(postcode)}` : "",
      `⏰ <b>Needed:</b> ${escapeTelegramHtml(displayTimeNeeded)}`,
      phone ? `📱 <b>Phone:</b> ${escapeTelegramHtml(phone)}` : "",
      email ? `✉️ <b>Email:</b> ${escapeTelegramHtml(email)}` : "",
      source ? `🔎 <b>Source:</b> ${escapeTelegramHtml(source)}` : "",
      photoCount > 0 ? `📸 <b>Photos:</b> ${photoCount}` : "",
      photoCount > 0 && photoUrl ? `🔗 <b>Photo link:</b> ${escapeTelegramHtml(photoUrl)}` : "",
      requestId ? `🆔 <b>Request ID:</b> <code>${escapeTelegramHtml(requestId)}</code>` : "",
      "",
      details ? `📝 <b>Details</b>\n${escapeTelegramHtml(details)}` : "📝 <b>Details</b>\nNo details",
      "",
      `Admin: ${escapeTelegramHtml(adminUrl)}`,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Quickola Telegram failed:", errorText);
    }
  } catch (error) {
    console.error("Failed to send Telegram request alert:", error);
  }
}

async function sendAdminBusinessAlert({
  businessName,
  category,
  whatsapp,
  email,
  phone,
  postcode,
  postcodeDistricts,
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
  email?: string | null;
  phone?: string | null;
  postcode?: string | null;
  postcodeDistricts?: string[];
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
    const displayPostcodeDistricts = postcodeDistricts?.length
      ? postcodeDistricts.join(", ")
      : "Not provided";

    await sendEmailOrLog({
      subject: `New Quickola provider application: ${businessName || "Unnamed business"}`,
      text: `
New Quickola provider application

Business: ${businessName || "Not provided"}
Service: ${displayCategory || "Not provided"}
WhatsApp: ${whatsapp || "Not provided"}
Email: ${email || "Not provided"}
Phone: ${phone || "Not provided"}
Postcode: ${postcode || "Not provided"}
Postcode districts: ${displayPostcodeDistricts}
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
${buildProviderOfferUrl("").replace(/\/p\/provider-offer\/$/, "")}/qk-ops-7f3a
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
  const email = clean(formData.get("email")).toLowerCase();
  const contactName = clean(formData.get("contactName"));
  const phone = clean(formData.get("phone"));
  const postcode = clean(formData.get("postcode")).toUpperCase();
  const startingPrice = clean(formData.get("startingPrice"));
  const availability = clean(formData.get("availability"));
  const profileSlug = clean(formData.get("profileSlug"));
  const description = clean(formData.get("description"));
  const areas = cleanUpperList(formData.getAll("areas"));
  const areasCustom = clean(formData.get("areasCustom"));
  const postcodeDistrictsCustom = clean(formData.get("postcodeDistricts"));
  const source = clean(formData.get("source")) || "website";
  const postcodeDistrict = getPostcodeDistrict(postcode);
  const allAreas = Array.from(new Set([...areas, ...cleanCommaList(areasCustom)]));
  const postcodeDistricts = Array.from(
    new Set([
      postcodeDistrict,
      ...cleanCommaList(postcodeDistrictsCustom),
    ].filter(Boolean))
  );
  const services = cleanServiceList(formData.getAll("services"), category);

  const { error } = await supabase.from("businesses").insert({
    business_name: businessName,
    category,
    whatsapp,
    email: email || null,
    contact_name: contactName || null,
    phone: phone || null,
    postcode: postcode || null,
    base_location: allAreas[0] || postcodeDistrict || null,
    postcode_districts: postcodeDistricts,
    services,
    starting_price: toNumberOrNull(startingPrice),
    areas: allAreas,
    availability,
    profile_slug: profileSlug,
    description,
    status: "new",
    source,
    active: true,
    trust_score: 50,
    provider_score: 50,
    verification_status: "unverified",
    provider_type: "local_business",
    accepts_whatsapp_alerts: true,
    whatsapp_alerts_enabled: true,
    email_alerts_enabled: Boolean(email),
    auto_match_enabled: false,
    auto_send_enabled: false,
    max_daily_leads: 3,
    leads_sent_today: 0,
    preferred_contact_method: whatsapp ? "whatsapp" : email ? "email" : "whatsapp",
    subscription_plan: "free",
    subscription_status: "free",
    onboarding_stage: "new",
  });

  if (error) {
    console.error("Failed to create business:", error);
    throw new Error(`Could not save business: ${error.message}`);
  }

  await sendAdminBusinessAlert({
    businessName,
    category,
    whatsapp,
    email: email || null,
    phone: phone || null,
    postcode: postcode || null,
    postcodeDistricts,
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
  const email = clean(formData.get("email")).toLowerCase();
  const contactName = clean(formData.get("contact_name"));
  const phone = clean(formData.get("phone"));
  const postcode = clean(formData.get("postcode")).toUpperCase();
  const startingPriceRaw = clean(formData.get("starting_price"));
  const minimumChargeRaw = clean(formData.get("minimum_charge"));
  const calloutFeeRaw = clean(formData.get("callout_fee"));
  const areasRaw = clean(formData.get("areas"));
  const postcodeDistrictsRaw = clean(formData.get("postcode_districts"));
  const servicesRaw = clean(formData.get("services"));
  const availability = clean(formData.get("availability"));
  const description = clean(formData.get("description"));
  const maxDailyLeadsRaw = clean(formData.get("max_daily_leads"));

  if (!businessName || !category || !whatsapp) {
    throw new Error("Business name, service and WhatsApp are required.");
  }

  const areas = cleanCommaList(areasRaw);
  const postcodeDistrict = getPostcodeDistrict(postcode);
  const postcodeDistricts = Array.from(
    new Set([
      postcodeDistrict,
      ...cleanCommaList(postcodeDistrictsRaw),
    ].filter(Boolean))
  );
  const services = Array.from(
    new Set([
      category,
      ...servicesRaw
        .split(",")
        .map((service) => service.trim().toLowerCase())
        .filter(Boolean),
    ].filter(Boolean))
  );
  const parsedStartingPrice = toNumberOrNull(startingPriceRaw);
  const parsedMinimumCharge = toNumberOrNull(minimumChargeRaw);
  const parsedCalloutFee = toNumberOrNull(calloutFeeRaw);
  const parsedMaxDailyLeads = Number(maxDailyLeadsRaw || 5);

  const { error } = await supabase.from("businesses").insert({
    business_name: businessName,
    category,
    whatsapp,
    email: email || null,
    contact_name: contactName || null,
    phone: phone || null,
    postcode: postcode || null,
    base_location: areas[0] || postcodeDistrict || null,
    postcode_districts: postcodeDistricts,
    services,
    starting_price: parsedStartingPrice,
    minimum_charge: parsedMinimumCharge,
    callout_fee: parsedCalloutFee,
    areas,
    availability: availability || null,
    description: description || null,
    status: "approved",
    source: "manual",
    approved_at: new Date().toISOString(),
    active: true,
    trust_score: 60,
    provider_score: 60,
    verification_status: "manually_checked",
    verification_notes: "Added manually from admin provider form.",
    provider_type: "local_business",
    accepts_whatsapp_alerts: true,
    whatsapp_alerts_enabled: true,
    email_alerts_enabled: Boolean(email),
    auto_match_enabled: true,
    auto_send_enabled: false,
    max_daily_leads: Number.isFinite(parsedMaxDailyLeads) ? parsedMaxDailyLeads : 5,
    leads_sent_today: 0,
    preferred_contact_method: whatsapp ? "whatsapp" : email ? "email" : "whatsapp",
    subscription_plan: "free",
    subscription_status: "free",
    onboarding_stage: "approved",
    last_verified_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to add provider:", error);
    throw new Error(`Could not add provider: ${error.message}`);
  }

  await sendAdminBusinessAlert({
    businessName,
    category,
    whatsapp,
    email: email || null,
    phone: phone || null,
    postcode: postcode || null,
    postcodeDistricts,
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
  const requestId = clean(formData.get("request_id"));
  const service = clean(formData.get("service")) || "cleaner";
  const area = clean(formData.get("area")) || "slough";
  const postcode = clean(formData.get("postcode")).toUpperCase();
  const jobType = clean(formData.get("job_type"));
  const jobDetail = clean(formData.get("job_detail"));
  const timeNeeded = clean(formData.get("time_needed")) || "this-week";
  const email = clean(formData.get("email"));
  const phone = clean(formData.get("phone"));
  const source = clean(formData.get("source")) || "check-price";
  const intent = clean(formData.get("intent")) || "wants-provider";

  const requestedLane = getRequestLane(service);
  const providerLane = clean(formData.get("provider_lane")) || requestedLane.providerLane;
  const jobSize = clean(formData.get("job_size")) || requestedLane.jobSize;
  const jobRisk = clean(formData.get("job_risk")) || requestedLane.jobRisk;
  const customerBudgetRaw = clean(formData.get("customer_budget"));
  const customerBudget = toNumberOrNull(customerBudgetRaw);
  const budgetNote = clean(formData.get("budget_note"));

  const phoneLooksValid = /^07[0-9]{9}$/.test(phone);

  if (!phoneLooksValid) {
    console.error("Quickola book request blocked because phone number was invalid.", {
      service,
      area,
      postcode,
      phoneLength: phone.length,
      phoneStart: phone.slice(0, 2),
    });

    throw new Error("Please enter an 11-digit UK mobile number starting with 07.");
  }

  const savedRequestId = requestId || crypto.randomUUID();
  let photoPaths: string[] = [];

  try {
    photoPaths = await uploadRequestPhotos({
      formData,
      requestId: savedRequestId,
    });
  } catch (error) {
    console.error("Request saved without photos because photo upload failed:", {
      requestId: savedRequestId,
      service,
      area,
      postcode,
      error,
    });
    photoPaths = [];
  }

  const details = [
    jobType ? `Job type: ${jobType}` : "",
    jobDetail ? `Job detail: ${jobDetail}` : "",
    postcode ? `Postcode: ${postcode}` : "",
    timeNeeded ? `Time needed: ${timeNeeded}` : "",
    photoPaths.length ? `Photos uploaded: ${photoPaths.length}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const completedPayload = {
    service,
    area,
    postcode: postcode || null,
    details,
    phone: phone || null,
    email,
    time_needed: timeNeeded,
    source,
    status: "ready_for_provider",
    cumar_status: "completed",
    cumar_notes: "Customer asked Quickola to connect them with one suitable local provider.",
    provider_lane: providerLane,
    job_size: jobSize,
    job_risk: jobRisk,
    customer_budget: customerBudget,
    budget_note: budgetNote || null,
    ready_for_pol: true,
    pol_status: "waiting",
    missing_fields: [],
    raw_payload: {
      request_id: savedRequestId,
      service,
      area,
      postcode,
      job_type: jobType,
      job_detail: jobDetail,
      time_needed: timeNeeded,
      email,
      phone: phone || null,
      source,
      intent,
      provider_lane: providerLane,
      job_size: jobSize,
      job_risk: jobRisk,
      customer_budget: customerBudget,
      budget_note: budgetNote || null,
      has_photos: photoPaths.length > 0,
      photo_count: photoPaths.length,
      photo_paths: photoPaths,
      photo_bucket: REQUEST_PHOTO_BUCKET,
    },
  };

  if (requestId) {
    const { data, error } = await supabase
      .from("requests")
      .update(completedPayload)
      .eq("id", requestId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Failed to complete Cumar request:", error);
      throw new Error(`Could not complete request: ${error.message}`);
    }

    if (!data) {
      console.error("Request id from book page was not found. Creating a new completed request instead:", requestId);

      const { error: insertFallbackError } = await supabase
        .from("requests")
        .insert({
          id: savedRequestId,
          ...completedPayload,
        });

      if (insertFallbackError) {
        console.error("Failed to save fallback check-price request:", insertFallbackError);
        throw new Error(`Could not save request: ${insertFallbackError.message}`);
      }
    }
  } else {
    const { error } = await supabase
      .from("requests")
      .insert({
        id: savedRequestId,
        ...completedPayload,
      });

    if (error) {
      console.error("Failed to save check-price request:", error);
      throw new Error(`Could not save request: ${error.message}`);
    }
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

  await sendTelegramRequestAlert({
    requestId: savedRequestId,
    service,
    area,
    postcode,
    timeNeeded,
    email,
    phone,
    details,
    source,
    photoCount: photoPaths.length,
  });

  revalidatePath("/qk-ops-7f3a");

  const params = new URLSearchParams({
    service,
    area,
    postcode,
    intent: "wants-provider",
    job_type: jobType,
    job_detail: jobDetail,
    time_needed: timeNeeded,
    email,
    source,
    request_id: savedRequestId,
    ready_for_provider: "true",
    provider_lane: providerLane,
    job_size: jobSize,
    job_risk: jobRisk,
  });

  if (phone) {
    params.set("phone", phone);
  }

  if (customerBudget !== null) {
    params.set("customer_budget", String(customerBudget));
  }

  if (source === "book-page") {
    redirect(`/complete?${params.toString()}`);
  }

  redirect(`/results?${params.toString()}`);
}

export async function runPolForRequest(formData: FormData) {
  const requestId = clean(formData.get("request_id"));
  const supabaseAdmin = getSupabaseAdmin();

  if (!requestId) {
    throw new Error("Missing request id for Pol.");
  }

  const { data: request, error: requestError } = await supabaseAdmin
    .from("requests")
    .select(
      "id, service, area, postcode, details, time_needed, provider_lane, job_size, job_risk, customer_budget, budget_note, ready_for_pol, pol_status"
    )
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    console.error("Pol failed to read request:", requestError);
    throw new Error(`Pol could not read request: ${requestError?.message || "not found"}`);
  }

  if (!request.ready_for_pol) {
    throw new Error("This request is not ready for Pol yet.");
  }

  const service = String(request.service || "").trim();
  const postcode = String(request.postcode || "").trim().toUpperCase();
  const postcodeDistrict = getPostcodeDistrict(postcode);
  const providerLane = String(request.provider_lane || getRequestLane(service).providerLane);
  const matchLabel = getProviderMatchLabel(providerLane);

  let providerQuery = supabaseAdmin
    .from("businesses")
    .select(
      "id, business_name, category, services, areas, postcode_districts, whatsapp, email, status, active, provider_type, auto_match_enabled, auto_send_enabled, accepts_whatsapp_alerts, whatsapp_alerts_enabled, email_alerts_enabled, starting_price, minimum_charge, callout_fee, availability, trust_score, provider_score, average_response_minutes, completed_jobs, last_contacted_at, max_daily_leads, leads_sent_today"
    )
    .eq("active", true)
    .eq("status", "approved")
    .eq("auto_match_enabled", true);

  if (providerLane) {
    providerQuery = providerQuery.eq("provider_type", providerLane);
  }

  const { data: providers, error: providerError } = await providerQuery;

  if (providerError) {
    console.error("Pol failed to find providers:", providerError);
    throw new Error(`Pol could not find providers: ${providerError.message}`);
  }

  const matchingProviders = (providers || []).filter((provider) => {
    const services = Array.isArray(provider.services) ? provider.services : [];
    const districts = Array.isArray(provider.postcode_districts) ? provider.postcode_districts : [];
    const areas = Array.isArray(provider.areas) ? provider.areas : [];
    const dailyLimit = Number(provider.max_daily_leads || 5);
    const leadsToday = Number(provider.leads_sent_today || 0);

    const serviceMatches =
      provider.category === service ||
      services.includes(service) ||
      services.includes("all") ||
      (service === "local-helper" && provider.provider_type === "local_helper");

    const areaMatches =
      !postcodeDistrict ||
      districts.includes(postcodeDistrict) ||
      areas.includes(postcodeDistrict) ||
      areas.includes("SLOUGH") ||
      areas.includes("ALL");

    const hasContact = Boolean(provider.whatsapp || provider.email);
    const underDailyLimit = leadsToday < dailyLimit;

    return serviceMatches && areaMatches && hasContact && underDailyLimit;
  });

  const rankedProviders = sortProvidersForPol(matchingProviders).slice(0, 5);

  if (!rankedProviders.length) {
    const { error: noProviderUpdateError } = await supabaseAdmin
      .from("requests")
      .update({
        status: "matching_failed",
        pol_status: "failed_no_provider",
        admin_notes: "Pol could not find an approved matching provider for this request.",
      })
      .eq("id", requestId);

    if (noProviderUpdateError) {
      console.error("Pol failed to update no-provider request:", noProviderUpdateError);
      throw new Error(`Pol could not update request: ${noProviderUpdateError.message}`);
    }

    revalidatePath("/qk-ops-7f3a");
    revalidatePath("/qk-ops-v2");
    return;
  }

  const matchRows = rankedProviders.map((provider, index) => ({
    request_id: requestId,
    business_id: provider.id,
    status: "queued",
    rough_range: provider.starting_price
      ? `From £${provider.starting_price}`
      : request.customer_budget
        ? `Customer budget around £${request.customer_budget}`
        : null,
    callout_fee: provider.callout_fee ?? null,
    minimum_charge: provider.minimum_charge ?? null,
    final_price_depends_on:
      "Final price depends on exact job details, access, urgency, photos and provider availability.",
    match_label: matchLabel,
    user_option_number: index + 1,
  }));

  const { error: matchInsertError } = await supabaseAdmin
    .from("request_matches")
    .upsert(matchRows, {
      onConflict: "request_id,business_id",
      ignoreDuplicates: true,
    });

  if (matchInsertError) {
    console.error("Pol failed to create request_matches:", matchInsertError);
    throw new Error(`Pol could not create matches: ${matchInsertError.message}`);
  }

  const { error: requestUpdateError } = await supabaseAdmin
    .from("requests")
    .update({
      status: "matching_in_progress",
      pol_status: "matching",
      admin_notes: `Pol matched ${rankedProviders.length} provider(s). Review queued matches before sending.`,
    })
    .eq("id", requestId);

  if (requestUpdateError) {
    console.error("Pol failed to update request status:", requestUpdateError);
    throw new Error(`Pol could not update request: ${requestUpdateError.message}`);
  }

  revalidatePath("/qk-ops-7f3a");
  revalidatePath("/qk-ops-v2");
}

export async function sendPolMatchToProvider(formData: FormData) {
  const matchId = clean(formData.get("request_match_id"));
  const supabaseAdmin = getSupabaseAdmin();

  if (!matchId) {
    throw new Error("Missing request match id for Pol send.");
  }

  const { data: match, error: matchError } = await supabaseAdmin
    .from("request_matches")
    .select(
      "id, request_id, business_id, status, rough_range, callout_fee, minimum_charge, match_label, user_option_number, provider_offer_token, provider_offer_expires_at"
    )
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    console.error("Pol failed to read match:", matchError);
    throw new Error(`Pol could not read match: ${matchError?.message || "not found"}`);
  }

  const [{ data: request, error: requestError }, { data: provider, error: providerError }] = await Promise.all([
    supabaseAdmin
      .from("requests")
      .select(
        "id, service, area, postcode, details, time_needed, provider_lane, job_size, job_risk, customer_budget, budget_note, email, phone"
      )
      .eq("id", match.request_id)
      .single(),
    supabaseAdmin
      .from("businesses")
      .select(
        "id, business_name, category, whatsapp, email, phone, provider_type, email_alerts_enabled, whatsapp_alerts_enabled, auto_send_enabled"
      )
      .eq("id", match.business_id)
      .single(),
  ]);

  if (requestError || !request) {
    console.error("Pol failed to read request for provider send:", requestError);
    throw new Error(`Pol could not read request: ${requestError?.message || "not found"}`);
  }

  if (providerError || !provider) {
    console.error("Pol failed to read provider for send:", providerError);
    throw new Error(`Pol could not read provider: ${providerError?.message || "not found"}`);
  }

  const providerOfferToken = match.provider_offer_token || buildProviderOfferToken();
  const expiryMinutes = getProviderOfferExpiryMinutes(request.time_needed);
  const providerOfferExpiresAt =
    match.provider_offer_expires_at || new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();
  const providerOfferUrl = buildProviderOfferUrl(providerOfferToken);
  const providerMessage = buildShortProviderOfferMessage({
    request,
    match,
    providerOfferUrl,
    expiryMinutes,
  });
  const whatsappLink = buildWhatsappLink(provider.whatsapp, providerMessage);
  const canEmailProvider = Boolean(provider.email && provider.email_alerts_enabled !== false);

  let emailSent = false;

  if (canEmailProvider) {
    emailSent = await sendProviderEmailOrLog({
      to: provider.email,
      subject: `Quickola lead: ${formatPolText(request.service)} in ${request.postcode || request.area || "Slough"}`,
      text: providerMessage,
    });
  }

  const channelNoteParts = [
    emailSent ? "email_sent" : provider.email ? "email_not_sent" : "no_email",
    whatsappLink ? "whatsapp_ready" : "no_whatsapp",
  ];

  const { error: updateMatchError } = await supabaseAdmin
    .from("request_matches")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      provider_offer_token: providerOfferToken,
      provider_offer_expires_at: providerOfferExpiresAt,
      provider_reply_raw: providerMessage,
      provider_reply: whatsappLink
        ? `WhatsApp ready: ${whatsappLink}`
        : "Provider message prepared.",
      admin_approved_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (updateMatchError) {
    console.error("Pol failed to mark match as sent:", updateMatchError);
    throw new Error(`Pol could not update match: ${updateMatchError.message}`);
  }

  const { error: updateRequestError } = await supabaseAdmin
    .from("requests")
    .update({
      status: "matching_in_progress",
      pol_status: "sent_to_providers",
      admin_notes: `Pol sent/prepared provider message for ${provider.business_name}. ${channelNoteParts.join(", ")}.`,
    })
    .eq("id", match.request_id);

  if (updateRequestError) {
    console.error("Pol failed to update request after provider send:", updateRequestError);
    throw new Error(`Pol could not update request: ${updateRequestError.message}`);
  }

  revalidatePath("/qk-ops-7f3a");
  revalidatePath("/qk-ops-v2");
}

export async function markProviderOfferOpened(token: string) {
  const supabaseAdmin = getSupabaseAdmin();

  if (!token) return;

  await supabaseAdmin
    .from("request_matches")
    .update({ provider_offer_opened_at: new Date().toISOString() })
    .eq("provider_offer_token", token)
    .is("provider_offer_opened_at", null);
}

export async function acceptProviderOffer(formData: FormData) {
  const token = clean(formData.get("token"));
  const quotedPrice = toNumberOrNull(clean(formData.get("quoted_price")));
  const availability = clean(formData.get("availability"));
  const supabaseAdmin = getSupabaseAdmin();

  if (!token) {
    throw new Error("Missing provider offer token.");
  }

  const { data: match, error: matchError } = await supabaseAdmin
    .from("request_matches")
    .select("id, request_id, business_id, provider_offer_expires_at")
    .eq("provider_offer_token", token)
    .single();

  if (matchError || !match) {
    console.error("Provider offer accept failed:", matchError);
    throw new Error("This provider offer was not found.");
  }

  if (match.provider_offer_expires_at && new Date(match.provider_offer_expires_at).getTime() < Date.now()) {
    throw new Error("This provider offer has expired.");
  }

  const { data: request, error: requestError } = await supabaseAdmin
    .from("requests")
    .select("id, email, phone")
    .eq("id", match.request_id)
    .single();

  if (requestError || !request) {
    console.error("Provider offer accept request read failed:", requestError);
    throw new Error("Could not read request for this offer.");
  }

  const customerContact = [
    request.phone ? `Phone: ${request.phone}` : "",
    request.email ? `Email: ${request.email}` : "",
  ]
    .filter(Boolean)
    .join(" | ") || "No customer contact saved.";

  const { error: matchUpdateError } = await supabaseAdmin
    .from("request_matches")
    .update({
      status: "accepted",
      quoted_price: quotedPrice,
      availability: availability || null,
      accepted_at: new Date().toISOString(),
      provider_actioned_at: new Date().toISOString(),
      provider_reply: `Provider accepted using offer link. ${customerContact}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", match.id);

  if (matchUpdateError) {
    console.error("Provider offer accept match update failed:", matchUpdateError);
    throw new Error(`Could not accept offer: ${matchUpdateError.message}`);
  }

  const { error: requestUpdateError } = await supabaseAdmin
    .from("requests")
    .update({
      status: "provider_assigned",
      pol_status: "provider_accepted",
      zayn_status: "follow_up_needed",
      admin_notes: `Provider accepted using offer link. Customer contact shown to provider: ${customerContact}. Provider should contact the customer directly. Zayn should follow up afterwards.`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", match.request_id);

  if (requestUpdateError) {
    console.error("Provider offer accept request update failed:", requestUpdateError);
    throw new Error(`Could not update request: ${requestUpdateError.message}`);
  }

  revalidatePath("/qk-ops-7f3a");
  revalidatePath("/qk-ops-v2");
  redirect(`/p/provider-offer/${token}?accepted=1`);
}

export async function markProviderCustomerContactStatus(formData: FormData) {
  const token = clean(formData.get("token"));
  const contactStatus = clean(formData.get("contact_status"));
  const supabaseAdmin = getSupabaseAdmin();

  if (!token) {
    throw new Error("Missing provider offer token.");
  }

  const allowedStatuses = new Set([
    "customer_contacted",
    "customer_no_answer",
    "customer_unreachable",
  ]);

  if (!allowedStatuses.has(contactStatus)) {
    throw new Error("Invalid provider contact status.");
  }

  const { data: match, error: matchError } = await supabaseAdmin
    .from("request_matches")
    .select("id, request_id, status")
    .eq("provider_offer_token", token)
    .single();

  if (matchError || !match) {
    console.error("Provider contact status update failed:", matchError);
    throw new Error("This provider offer was not found.");
  }

  const note = getProviderContactNote(contactStatus);
  const now = new Date().toISOString();

  const { error: matchUpdateError } = await supabaseAdmin
    .from("request_matches")
    .update({
      status: contactStatus,
      provider_reply: note,
      provider_actioned_at: now,
      updated_at: now,
    })
    .eq("id", match.id);

  if (matchUpdateError) {
    console.error("Provider contact status match update failed:", matchUpdateError);
    throw new Error(`Could not update provider contact status: ${matchUpdateError.message}`);
  }

  const { error: requestUpdateError } = await supabaseAdmin
    .from("requests")
    .update({
      status: contactStatus === "customer_contacted" ? "in_progress" : "provider_assigned",
      pol_status: contactStatus,
      zayn_status: "follow_up_needed",
      admin_notes: `${note} Zayn should follow up to confirm booking, completion and rating.`,
      updated_at: now,
    })
    .eq("id", match.request_id);

  if (requestUpdateError) {
    console.error("Provider contact status request update failed:", requestUpdateError);
    throw new Error(`Could not update request contact status: ${requestUpdateError.message}`);
  }

  revalidatePath("/qk-ops-7f3a");
  revalidatePath("/qk-ops-v2");
  redirect(`/p/provider-offer/${token}?accepted=1&contact=${contactStatus}`);
}

export async function markProviderJobOutcome(formData: FormData) {
  const token = clean(formData.get("token"));
  const outcome = clean(formData.get("outcome"));
  const finalAmountCharged = toNumberOrNull(clean(formData.get("final_amount_charged")));
  const supabaseAdmin = getSupabaseAdmin();

  if (!token) {
    throw new Error("Missing provider offer token.");
  }

  const allowedOutcomes = new Set([
    "job_completed",
    "customer_cancelled",
    "job_not_completed",
  ]);

  if (!allowedOutcomes.has(outcome)) {
    throw new Error("Invalid provider job outcome.");
  }

  const { data: match, error: matchError } = await supabaseAdmin
    .from("request_matches")
    .select("id, request_id, business_id, status")
    .eq("provider_offer_token", token)
    .single();

  if (matchError || !match) {
    console.error("Provider job outcome update failed:", matchError);
    throw new Error("This provider offer was not found.");
  }

  const now = new Date().toISOString();
  const note = getProviderJobOutcomeNote(outcome);
  const matchStatus = outcome === "job_completed" ? "provider_marked_completed" : outcome;
  const requestStatus = outcome === "job_completed" ? "provider_marked_completed" : outcome === "customer_cancelled" ? "cancelled" : "issue_reported";
  const polStatus = outcome === "job_completed" ? "provider_marked_completed" : outcome;
  const zaynStatus = outcome === "job_completed" ? "confirm_customer_satisfaction" : "follow_up_needed";

  const { error: matchUpdateError } = await supabaseAdmin
    .from("request_matches")
    .update({
      status: matchStatus,
      provider_reply: finalAmountCharged !== null
        ? `${note} Final amount charged: £${finalAmountCharged}. Awaiting customer confirmation.`
        : `${note} Awaiting customer confirmation.`,
      quoted_price: outcome === "job_completed" && finalAmountCharged !== null
        ? finalAmountCharged
        : null,
      completed_at: null,
      provider_actioned_at: now,
      updated_at: now,
    })
    .eq("id", match.id);

  if (matchUpdateError) {
    console.error("Provider job outcome match update failed:", matchUpdateError);
    throw new Error(`Could not update provider job outcome: ${matchUpdateError.message}`);
  }


  const { error: requestUpdateError } = await supabaseAdmin
    .from("requests")
    .update({
      status: requestStatus,
      pol_status: polStatus,
      zayn_status: zaynStatus,
      estimated_value: outcome === "job_completed" && finalAmountCharged !== null
        ? finalAmountCharged
        : null,
      completed_at: null,
      matched_business_id: match.business_id,
      admin_notes: outcome === "job_completed"
        ? `${note}${finalAmountCharged !== null ? ` Final amount charged: £${finalAmountCharged}.` : ""} Awaiting customer satisfaction confirmation before marking fully completed. This confirmation is used to improve Quickola quality, protect customers and monitor provider standards.`
        : `${note}${finalAmountCharged !== null ? ` Final amount charged: £${finalAmountCharged}.` : ""}`,
      updated_at: now,
    })
    .eq("id", match.request_id);

  if (requestUpdateError) {
    console.error("Provider job outcome request update failed:", requestUpdateError);
    throw new Error(`Could not update request job outcome: ${requestUpdateError.message}`);
  }


  revalidatePath("/qk-ops-7f3a");
  revalidatePath("/qk-ops-v2");
  redirect(`/p/provider-offer/${token}?accepted=1&contact=customer_contacted&outcome=${outcome}${finalAmountCharged !== null ? `&amount=${finalAmountCharged}` : ""}`);

}

export async function submitCustomerJobConfirmation(formData: FormData) {
  const requestId = clean(formData.get("request_id"));
  const paidAmount = toNumberOrNull(clean(formData.get("customer_paid_amount")));
  const rating = toNumberOrNull(clean(formData.get("customer_rating")));
  const issue = clean(formData.get("customer_issue"));
  const feedback = clean(formData.get("customer_feedback"));
  const supabaseAdmin = getSupabaseAdmin();

  if (!requestId) {
    throw new Error("Missing request id.");
  }

  if (rating === null || rating < 1 || rating > 5) {
    throw new Error("Please choose a rating from 1 to 5.");
  }

  const allowedIssues = new Set([
    "no_issue",
    "minor_issue",
    "serious_issue",
    "not_completed",
  ]);

  if (!allowedIssues.has(issue)) {
    throw new Error("Please choose whether there was an issue.");
  }

  const { data: request, error: requestReadError } = await supabaseAdmin
    .from("requests")
    .select("id, status, pol_status, zayn_status, matched_business_id")
    .eq("id", requestId)
    .single();

  if (requestReadError || !request) {
    console.error("Customer confirmation request read failed:", requestReadError);
    throw new Error("Could not find this Quickola job.");
  }

  const now = new Date().toISOString();
  const isHappyCompletion = rating >= 4 && issue === "no_issue";
  const nextRequestStatus = isHappyCompletion ? "completed" : "issue_reported";
  const nextZaynStatus = isHappyCompletion ? "completed_happy" : "needs_review";
  const nextPolStatus = isHappyCompletion ? "customer_confirmed_completed" : "customer_reported_issue";

  const adminNote = isHappyCompletion
    ? `Customer confirmed the job was completed happily. Rating: ${rating}/5.${paidAmount !== null ? ` Customer paid: £${paidAmount}.` : ""}${feedback ? ` Feedback: ${feedback}` : ""}`
    : `Customer reported an issue after provider marked completed. Rating: ${rating}/5. Issue: ${issue}.${paidAmount !== null ? ` Customer paid: £${paidAmount}.` : ""}${feedback ? ` Feedback: ${feedback}` : ""}`;

  const { error: requestUpdateError } = await supabaseAdmin
    .from("requests")
    .update({
      status: nextRequestStatus,
      pol_status: nextPolStatus,
      zayn_status: nextZaynStatus,
      estimated_value: paidAmount !== null ? paidAmount : undefined,
      customer_paid_amount: paidAmount,
      customer_rating: rating,
      customer_issue: issue,
      customer_feedback: feedback || null,
      customer_confirmed_at: now,
      review_received_at: now,
      completed_at: isHappyCompletion ? now : null,
      admin_notes: adminNote,
      updated_at: now,
    })
    .eq("id", requestId);

  if (requestUpdateError) {
    console.error("Customer confirmation request update failed:", requestUpdateError);
    throw new Error(`Could not save customer confirmation: ${requestUpdateError.message}`);
  }

  const { data: match, error: matchReadError } = await supabaseAdmin
    .from("request_matches")
    .select("id, business_id, status")
    .eq("request_id", requestId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (matchReadError) {
    console.error("Customer confirmation match read failed:", matchReadError);
  }

  if (match) {
    const { error: matchUpdateError } = await supabaseAdmin
      .from("request_matches")
      .update({
        status: isHappyCompletion ? "completed" : "issue_reported",
        ...(paidAmount !== null ? { quoted_price: paidAmount } : {}),
        completed_at: isHappyCompletion ? now : null,
        provider_reply: isHappyCompletion
          ? `Customer confirmed completed. Rating: ${rating}/5.${paidAmount !== null ? ` Customer paid: £${paidAmount}.` : ""}`
          : `Customer reported issue. Rating: ${rating}/5. Issue: ${issue}.${paidAmount !== null ? ` Customer paid: £${paidAmount}.` : ""}`,
        updated_at: now,
      })
      .eq("id", match.id);

    if (matchUpdateError) {
      console.error("Customer confirmation match update failed:", matchUpdateError);
    }
  }

  const businessId = request.matched_business_id || match?.business_id;

  if (isHappyCompletion && businessId) {
    const { data: business, error: businessReadError } = await supabaseAdmin
      .from("businesses")
      .select("id, completed_jobs")
      .eq("id", businessId)
      .single();

    if (businessReadError) {
      console.error("Customer confirmation business read failed:", businessReadError);
    } else if (business) {
      const currentCompletedJobs = Number(business.completed_jobs || 0);
      const { error: businessUpdateError } = await supabaseAdmin
        .from("businesses")
        .update({ completed_jobs: currentCompletedJobs + 1 })
        .eq("id", businessId);

      if (businessUpdateError) {
        console.error("Customer confirmation completed jobs update failed:", businessUpdateError);
      }
    }
  }

  revalidatePath("/qk-ops-7f3a");
  revalidatePath("/qk-ops-v2");
  revalidatePath(`/c/customer-confirm/${requestId}`);
  redirect(`/c/customer-confirm/${requestId}?submitted=1`);

}

export async function markCompletedUnconfirmed(formData: FormData) {
  const requestId = clean(formData.get("request_id"));
  const note = clean(formData.get("note"));
  const supabaseAdmin = getSupabaseAdmin();

  if (!requestId) {
    throw new Error("Missing request id.");
  }

  const { data: request, error: requestReadError } = await supabaseAdmin
    .from("requests")
    .select("id, status, pol_status, zayn_status, matched_business_id, estimated_value")
    .eq("id", requestId)
    .single();

  if (requestReadError || !request) {
    console.error("Completed-unconfirmed request read failed:", requestReadError);
    throw new Error("Could not find this Quickola job.");
  }

  const now = new Date().toISOString();
  const adminNote = `Zayn marked this job as completed unconfirmed. Provider marked completed, customer did not respond, and no issue was reported.${note ? ` Note: ${note}` : ""}`;

  const { error: requestUpdateError } = await supabaseAdmin
    .from("requests")
    .update({
      status: "completed_unconfirmed",
      pol_status: "customer_no_response",
      zayn_status: "completed_unconfirmed",
      completed_unconfirmed_at: now,
      completed_at: now,
      admin_notes: adminNote,
      updated_at: now,
    })
    .eq("id", requestId);

  if (requestUpdateError) {
    console.error("Completed-unconfirmed request update failed:", requestUpdateError);
    throw new Error(`Could not mark completed unconfirmed: ${requestUpdateError.message}`);
  }

  const { data: match, error: matchReadError } = await supabaseAdmin
    .from("request_matches")
    .select("id, business_id, status")
    .eq("request_id", requestId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (matchReadError) {
    console.error("Completed-unconfirmed match read failed:", matchReadError);
  }

  if (match) {
    const { error: matchUpdateError } = await supabaseAdmin
      .from("request_matches")
      .update({
        status: "completed_unconfirmed",
        completed_at: now,
        provider_reply: "Marked completed unconfirmed by Zayn. Customer did not respond and no issue was reported.",
        updated_at: now,
      })
      .eq("id", match.id);

    if (matchUpdateError) {
      console.error("Completed-unconfirmed match update failed:", matchUpdateError);
    }
  }

  const businessId = request.matched_business_id || match?.business_id;

  if (businessId) {
    const { data: business, error: businessReadError } = await supabaseAdmin
      .from("businesses")
      .select("id, completed_jobs")
      .eq("id", businessId)
      .single();

    if (businessReadError) {
      console.error("Completed-unconfirmed business read failed:", businessReadError);
    } else if (business) {
      const currentCompletedJobs = Number(business.completed_jobs || 0);
      const { error: businessUpdateError } = await supabaseAdmin
        .from("businesses")
        .update({ completed_jobs: currentCompletedJobs + 1 })
        .eq("id", businessId);

      if (businessUpdateError) {
        console.error("Completed-unconfirmed completed jobs update failed:", businessUpdateError);
      }
    }
  }

  revalidatePath("/qk-ops-7f3a");
  revalidatePath("/qk-ops-v2");
  redirect("/qk-ops-v2");
}

export async function rejectProviderOffer(formData: FormData) {
  const token = clean(formData.get("token"));
  const reason = clean(formData.get("reason")) || "Provider rejected using offer link.";
  const supabaseAdmin = getSupabaseAdmin();

  if (!token) {
    throw new Error("Missing provider offer token.");
  }

  const { data: match, error: matchError } = await supabaseAdmin
    .from("request_matches")
    .select("id, request_id")
    .eq("provider_offer_token", token)
    .single();

  if (matchError || !match) {
    console.error("Provider offer reject failed:", matchError);
    throw new Error("This provider offer was not found.");
  }

  const { error: matchUpdateError } = await supabaseAdmin
    .from("request_matches")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      provider_actioned_at: new Date().toISOString(),
      provider_reply: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", match.id);

  if (matchUpdateError) {
    console.error("Provider offer reject match update failed:", matchUpdateError);
    throw new Error(`Could not reject offer: ${matchUpdateError.message}`);
  }

  const { error: requestUpdateError } = await supabaseAdmin
    .from("requests")
    .update({
      pol_status: "provider_rejected",
      admin_notes: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", match.request_id);

  if (requestUpdateError) {
    console.error("Provider offer reject request update failed:", requestUpdateError);
    throw new Error(`Could not update request: ${requestUpdateError.message}`);
  }

  revalidatePath("/qk-ops-v2");
  redirect(`/p/provider-offer/${token}?rejected=1`);
}

export async function recordProviderReply(formData: FormData) {
  const matchId = clean(formData.get("request_match_id"));
  const rawReply = clean(formData.get("provider_reply"));
  const supabaseAdmin = getSupabaseAdmin();

  if (!matchId) {
    throw new Error("Missing request match id for provider reply.");
  }

  if (!rawReply) {
    throw new Error("Provider reply is required.");
  }

  const parsedReply = parseProviderReplyText(rawReply);

  const { data: match, error: matchError } = await supabaseAdmin
    .from("request_matches")
    .select("id, request_id, business_id, status")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    console.error("Pol failed to read match before recording provider reply:", matchError);
    throw new Error(`Pol could not read match: ${matchError?.message || "not found"}`);
  }

  const { data: request, error: requestError } = await supabaseAdmin
    .from("requests")
    .select("id, service, area, postcode, provider_lane, status, pol_status, email, phone, details, time_needed")
    .eq("id", match.request_id)
    .single();

  if (requestError || !request) {
    console.error("Pol failed to read request before recording provider reply:", requestError);
    throw new Error(`Pol could not read request: ${requestError?.message || "not found"}`);
  }

  const customerContact = [
    request.phone ? `Phone: ${request.phone}` : "",
    request.email ? `Email: ${request.email}` : "",
  ]
    .filter(Boolean)
    .join(" | ") || "No customer contact saved.";

  const providerAcceptedNote =
    parsedReply.status === "accepted"
      ? `Provider accepted. Customer contact shown to provider: ${customerContact}. Provider should contact the customer directly. Zayn should follow up afterwards to confirm contact, booking, completion and rating.`
      : null;

  const matchUpdate: Record<string, any> = {
    status: parsedReply.status,
    provider_reply_raw: rawReply,
    provider_reply: parsedReply.note,
    updated_at: new Date().toISOString(),
  };

  if (parsedReply.status === "accepted") {
    matchUpdate.accepted_at = new Date().toISOString();
    matchUpdate.quoted_price = parsedReply.quotedPrice;
    matchUpdate.availability = parsedReply.availability;
  }

  if (parsedReply.status === "rejected") {
    matchUpdate.rejected_at = new Date().toISOString();
  }

  if (parsedReply.status === "needs_more_info") {
    matchUpdate.provider_reply = `Needs more info: ${rawReply}`;
  }

  if (parsedReply.status === "unclear") {
    matchUpdate.provider_reply = `Unclear reply: ${rawReply}`;
  }

  const { error: updateMatchError } = await supabaseAdmin
    .from("request_matches")
    .update(matchUpdate)
    .eq("id", matchId);

  if (updateMatchError) {
    console.error("Pol failed to update provider reply:", updateMatchError);
    throw new Error(`Pol could not update provider reply: ${updateMatchError.message}`);
  }

  const requestUpdate: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (parsedReply.status === "accepted") {
    requestUpdate.status = "provider_assigned";
    requestUpdate.pol_status = "provider_accepted";
    requestUpdate.zayn_status = "follow_up_needed";
    requestUpdate.admin_notes = providerAcceptedNote;
  }

  if (parsedReply.status === "needs_more_info") {
    requestUpdate.pol_status = "provider_needs_more_info";
    requestUpdate.admin_notes = `Provider needs more info: ${rawReply}`;
  }

  if (parsedReply.status === "unclear") {
    requestUpdate.pol_status = "provider_reply_unclear";
    requestUpdate.admin_notes = `Provider reply unclear. Nora should review: ${rawReply}`;
  }

  if (parsedReply.status === "rejected") {
    requestUpdate.pol_status = "provider_rejected";
    requestUpdate.admin_notes = `Provider rejected: ${rawReply}`;
  }

  const { error: updateRequestError } = await supabaseAdmin
    .from("requests")
    .update(requestUpdate)
    .eq("id", match.request_id);

  if (updateRequestError) {
    console.error("Pol failed to update request after provider reply:", updateRequestError);
    throw new Error(`Pol could not update request after provider reply: ${updateRequestError.message}`);
  }

  revalidatePath("/qk-ops-7f3a");
  revalidatePath("/qk-ops-v2");
}
