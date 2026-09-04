import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildAbsoluteAppUrl, getTransactionalEmailOrigin } from "@/lib/app-url";
import { getResendFromEmail, getResendReplyToEmail } from "@/lib/email-config";
import { isMarketplaceJobMatch } from "@/lib/marketplace/provider-job-matching";
import { canProviderBrowseJobs, isProviderBasicProfileComplete } from "@/lib/marketplace/provider-access";
import { ACTIVE_MARKETPLACE_OFFER_STATUSES } from "@/lib/marketplace/customer-job-state";

type EmailInput = {
  eventType: string;
  dedupeKey: string;
  recipientUserId?: string | null;
  recipientEmail?: string | null;
  jobId?: string | null;
  conversationId?: string | null;
  bookingId?: string | null;
  sourceId?: string | null;
  subject: string;
  html: string;
};

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
const origin = () => getTransactionalEmailOrigin({ appUrl: process.env.APP_URL, siteUrl: process.env.NEXT_PUBLIC_SITE_URL, nodeEnv: process.env.NODE_ENV });
const title = (job: { service_subtype?: string | null; service?: string | null }) => (job.service_subtype || job.service || "Local service").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const district = (postcode: string | null | undefined) => String(postcode || "").trim().split(/\s+/)[0] || "your area";
const link = (path: string) => buildAbsoluteAppUrl(path);
const layout = (content: string) => `<div style="background:#f7f8fa;padding:32px 16px;font-family:Arial,sans-serif;color:#071638"><div style="max-width:560px;margin:auto;background:#fff;padding:32px;border-radius:16px"><p style="font-size:20px;font-weight:700;margin:0 0 24px">Quickola</p>${content}</div></div>`;
const cta = (href: string, text: string) => `<p><a href="${escapeHtml(href)}" style="display:inline-block;background:#23a955;color:#061b3f;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">${escapeHtml(text)}</a></p>`;

export async function sendMarketplaceTransactionalEmail(input: EmailInput) {
  if (!input.recipientEmail?.trim()) {
    console.info("marketplace_transactional_email_skipped", { eventType: input.eventType, reason: "recipient_email_missing" });
    return { status: "skipped" as const, reason: "recipient_email_missing" as const };
  }
  let admin: ReturnType<typeof createSupabaseAdminClient> | null = null;
  try {
    admin = createSupabaseAdminClient();
    const { data: existing } = await admin.from("marketplace_email_notifications").select("id,status,attempt_count,last_attempt_at").eq("dedupe_key", input.dedupeKey).maybeSingle();
    if (existing?.status === "sent") return { status: "skipped" as const, reason: "already_sent" as const };
    // Pending means the delivery outcome is ambiguous. It is never reclaimed automatically.
    if (existing?.status === "pending") {
      return { status: "skipped" as const, reason: "pending_attempt" as const };
    } else if (existing?.status === "failed") {
      const { data: retried, error: retryError } = await admin.from("marketplace_email_notifications").update({ status: "pending", attempt_count: Number(existing.attempt_count || 0) + 1, last_attempt_at: new Date().toISOString(), failed_at: null, error_text: null }).eq("id", existing.id).eq("status", "failed").select("id").maybeSingle();
      if (retryError || !retried) return { status: "skipped" as const, reason: "retry_claimed" as const };
    } else {
      const { data: notification, error: reserveError } = await admin.from("marketplace_email_notifications").insert({
      dedupe_key: input.dedupeKey,
      event_type: input.eventType,
      recipient_user_id: input.recipientUserId || null,
      recipient_email: input.recipientEmail.trim(),
      job_id: input.jobId || null,
      conversation_id: input.conversationId || null,
      booking_id: input.bookingId || null,
      source_id: input.sourceId || null,
      status: "pending",
      attempt_count: 1,
      last_attempt_at: new Date().toISOString(),
    }).select("id").single();
      if (reserveError?.code === "23505") return sendMarketplaceTransactionalEmail(input);
      if (reserveError || !notification) throw reserveError || new Error("notification_reservation_failed");
    }
    const apiKey = process.env.RESEND_API_KEY;
    const from = getResendFromEmail();
    const emailOrigin = origin();
    if (!apiKey || !from || !emailOrigin) throw new Error(!apiKey ? "resend_api_key_missing" : !from ? "resend_from_email_missing" : "invalid_app_origin");
    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [input.recipientEmail.trim()], reply_to: getResendReplyToEmail() || undefined, subject: input.subject, html: input.html }) });
    } catch (error) {
      console.error("marketplace_transactional_email_ambiguous", { eventType: input.eventType, reason: error instanceof Error ? error.message.slice(0, 120) : "resend_request_failed" });
      return { status: "ambiguous" as const, reason: "resend_request_ambiguous" as const };
    }
    const responseBody = await response.json().catch(() => ({})) as { id?: string };
    if (!response.ok) {
      const reason = `resend_${response.status}`;
      await admin.from("marketplace_email_notifications").update({ status: "failed", failed_at: new Date().toISOString(), error_text: reason }).eq("dedupe_key", input.dedupeKey).eq("status", "pending");
      console.error("marketplace_transactional_email_failed", { eventType: input.eventType, reason });
      return { status: "failed" as const, reason };
    }
    let markSentError: { message?: string } | null = null;
    try { ({ error: markSentError } = await admin.from("marketplace_email_notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("dedupe_key", input.dedupeKey).eq("status", "pending")); } catch { markSentError = { message: "sent_state_update_failed" }; }
    if (markSentError) {
      console.error("marketplace_transactional_email_ambiguous", { eventType: input.eventType, reason: "sent_state_update_failed" });
      return { status: "ambiguous" as const, reason: "sent_state_update_failed" as const };
    }
    console.info("marketplace_transactional_email", { eventType: input.eventType, status: "sent" });
    return { status: "sent" as const, providerMessageId: responseBody.id || null };
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 120) : "delivery_failed";
    if (admin && !reason.startsWith("resend_request_ambiguous") && reason !== "sent_state_update_failed") await admin.from("marketplace_email_notifications").update({ status: "failed", failed_at: new Date().toISOString(), error_text: reason }).eq("dedupe_key", input.dedupeKey).eq("status", "pending");
    console.error("marketplace_transactional_email_failed", { eventType: input.eventType, reason });
    return { status: "failed" as const, reason };
  }
}

export async function sendProviderApprovedEmail(providerId: string) {
  const admin = createSupabaseAdminClient();
  const [{ data: provider }, authResult] = await Promise.all([
    admin.from("marketplace_providers").select("user_id,display_name,business_name").eq("user_id", providerId).maybeSingle(),
    admin.auth.admin.getUserById(providerId),
  ]);
  const recipientEmail = authResult.data.user?.email;
  if (!provider || !recipientEmail) return;
  const providerName = String(provider.display_name || provider.business_name || "").trim();
  const firstName = providerName.split(/\s+/)[0] || "there";
  await sendMarketplaceTransactionalEmail({
    eventType: "provider_approved",
    dedupeKey: `provider_approved:${provider.user_id}`,
    recipientUserId: provider.user_id,
    recipientEmail,
    subject: "You're approved to start working on Quickola",
    html: layout(`<p>Hi ${escapeHtml(firstName)},</p><p>Good news — your Quickola provider account has been approved.</p><p>You can now view matching jobs in your area, send offers and message customers through Quickola.</p>${cta(link("/work"), "View available jobs")}<p>Quickola<br>Local jobs. Local professionals.</p>`),
  });
}

export async function notifyFirstMarketplaceMessage(conversationId: string, senderId: string) {
  const admin = createSupabaseAdminClient();
  const { data: conversation } = await admin.from("marketplace_conversations").select("id,job_id,customer_id,provider_id,bidder_user_id,marketplace_jobs(service,service_subtype,postcode,public_token)").eq("id", conversationId).maybeSingle();
  if (!conversation) return;
  const job = Array.isArray(conversation.marketplace_jobs) ? conversation.marketplace_jobs[0] : conversation.marketplace_jobs;
  const { data: customer } = await admin.from("marketplace_customers").select("auth_user_id").eq("id", conversation.customer_id).maybeSingle();
  if (!customer?.auth_user_id) return;
  const providerId = conversation.provider_id || conversation.bidder_user_id;
  const isProviderSender = senderId === providerId;
  const recipientUserId = isProviderSender ? customer.auth_user_id : providerId;
  if (!recipientUserId) return;
  const recipient = await admin.auth.admin.getUserById(recipientUserId);
  const email = recipient.data.user?.email;
  if (!email || !job) return;
  const providerProfile = providerId ? (await admin.from("marketplace_providers").select("display_name,business_name").eq("user_id", providerId).maybeSingle()).data : null;
  const providerName = providerProfile?.display_name || providerProfile?.business_name || "Your provider";
  const jobTitle = title(job);
  const area = district(job.postcode);
  const path = isProviderSender ? `/messages/${conversationId}` : `/work/messages/${conversationId}`;
  const eventType = isProviderSender ? "first_provider_message" : "first_customer_message";
  const subject = isProviderSender ? `${providerName} sent you a message` : `New message about ${jobTitle}`;
  const body = isProviderSender ? `<h1>${escapeHtml(providerName)} sent you a message</h1><p>About your ${escapeHtml(jobTitle)} job in ${escapeHtml(area)}.</p>` : `<h1>You have a new message</h1><p>A customer sent you a message about ${escapeHtml(jobTitle)} in ${escapeHtml(area)}.</p>`;
  await sendMarketplaceTransactionalEmail({ eventType, dedupeKey: `${eventType}:${conversationId}:${recipientUserId}`, recipientUserId, recipientEmail: email, jobId: conversation.job_id, conversationId, subject, html: layout(`${body}${cta(link(path), "View message")}`) });
}

export async function notifyFirstMarketplaceOffer(jobId: string, sourceId?: string) {
  const admin = createSupabaseAdminClient();
  const { data: job } = await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,customer_id").eq("id", jobId).maybeSingle();
  if (!job?.customer_id) return;
  const quoteQuery = admin.from("marketplace_quotes").select("id,status").eq("job_id", jobId).in("status", ACTIVE_MARKETPLACE_OFFER_STATUSES).order("created_at", { ascending: true }).limit(1);
  const { data: quotes } = sourceId ? await admin.from("marketplace_quotes").select("id,status").eq("id", sourceId).eq("job_id", jobId).in("status", ACTIVE_MARKETPLACE_OFFER_STATUSES).limit(1) : await quoteQuery;
  const quote = quotes?.[0];
  if (!quote) return;
  const { data: customer } = await admin.from("marketplace_customers").select("auth_user_id").eq("id", job.customer_id).maybeSingle();
  if (!customer?.auth_user_id) return;
  const user = await admin.auth.admin.getUserById(customer.auth_user_id);
  if (!user.data.user?.email) return;
  const jobTitle = title(job);
  await sendMarketplaceTransactionalEmail({ eventType: "first_offer", dedupeKey: `first_offer:${job.id}:${customer.auth_user_id}`, recipientUserId: customer.auth_user_id, recipientEmail: user.data.user.email, jobId, sourceId: quote.id, subject: `You received an offer for ${jobTitle}`, html: layout(`<h1>Your job received its first offer</h1><p>Your ${escapeHtml(jobTitle)} job has received an offer from a local provider.</p>${cta(link(`/jobs/${job.public_token}`), "View offer")}`) });
}

export async function notifyMatchingProvidersForJob(jobId: string) {
  const admin = createSupabaseAdminClient();
  const { data: job } = await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,requested_timing,status").eq("id", jobId).maybeSingle();
  if (!job || !["posted", "finding_provider"].includes(job.status)) return;
  const { data: providers } = await admin.from("marketplace_providers").select("user_id,display_name,business_name,provider_status,stripe_status,marketplace_active,phone,provider_type,base_town,profile_photo_url").eq("provider_status", "approved");
  const providerIds = (providers || []).map((provider) => provider.user_id);
  const [{ data: allServices }, { data: allAreas }] = providerIds.length ? await Promise.all([
    admin.from("marketplace_provider_services").select("provider_id,category_slug,job_type_slug,active").in("provider_id", providerIds),
    admin.from("marketplace_provider_service_areas").select("provider_id,postcode_district,active").in("provider_id", providerIds),
  ]) : [{ data: [] }, { data: [] }];
  for (const provider of providers || []) {
    try {
      const authUser = await admin.auth.admin.getUserById(provider.user_id);
      if (!authUser.data.user?.email || provider.stripe_status !== "ready" || provider.marketplace_active === false || !isProviderBasicProfileComplete({ profile: provider } as never)) continue;
      const services = (allServices || []).filter((service) => service.provider_id === provider.user_id);
      const areas = (allAreas || []).filter((area) => area.provider_id === provider.user_id);
      if (!canProviderBrowseJobs({ providerStatus: "approved", stripeStatus: "ready", emailConfirmedAt: authUser.data.user.email_confirmed_at || authUser.data.user.confirmed_at || null, profile: provider } as never, (services || []).filter((service) => service.active).length) || !isMarketplaceJobMatch(job, services || [], areas || [])) continue;
      const jobTitle = title(job);
      await sendMarketplaceTransactionalEmail({ eventType: "new_matching_job", dedupeKey: `new_matching_job:${provider.user_id}:${job.id}`, recipientUserId: provider.user_id, recipientEmail: authUser.data.user.email, jobId, subject: `New ${jobTitle} job in ${district(job.postcode)}`, html: layout(`<h1>New job near you</h1><p>A new ${escapeHtml(jobTitle)} job in ${escapeHtml(district(job.postcode))} matches your services and work area.</p>${job.requested_timing ? `<p>Timing: ${escapeHtml(job.requested_timing)}</p>` : ""}${cta(link(`/work/jobs/${job.id}`), "View job")}`) });
    } catch (error) {
      console.error("marketplace_matching_email_failed", { jobId, providerId: provider.user_id, reason: error instanceof Error ? error.message.slice(0, 120) : "unknown" });
    }
  }
}

export async function notifyBookingPaid(bookingId: string) {
  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,customer_id,provider_id,amount_pence,marketplace_jobs(public_token,service,service_subtype,postcode)").eq("id", bookingId).maybeSingle();
  if (!booking) return;
  const job = Array.isArray(booking.marketplace_jobs) ? booking.marketplace_jobs[0] : booking.marketplace_jobs;
  if (!job) return;
  const jobTitle = title(job);
  const { data: quote } = await admin.from("marketplace_quotes").select("id,status,bidder_user_id,provider_id").eq("id", booking.quote_id).in("status", ["accepted", "selected"]).maybeSingle();
  const providerId = booking.provider_id || quote?.bidder_user_id || quote?.provider_id || null;
  const providerProfile = providerId ? (await admin.from("marketplace_providers").select("display_name,business_name").eq("user_id", providerId).maybeSingle()).data : null;
  const providerName = providerProfile?.display_name || providerProfile?.business_name || "your provider";
  const customer = booking.customer_id ? (await admin.from("marketplace_customers").select("auth_user_id").eq("id", booking.customer_id).maybeSingle()).data : null;
  const customerAuthUserId = customer?.auth_user_id || null;
  const customerUser = customerAuthUserId ? (await admin.auth.admin.getUserById(customerAuthUserId)).data.user : null;
  if (customerUser?.email && customerAuthUserId) await sendMarketplaceTransactionalEmail({ eventType: "booking_confirmed_customer", dedupeKey: `booking_confirmed_customer:${booking.id}:${customerAuthUserId}`, recipientUserId: customerAuthUserId, recipientEmail: customerUser.email, jobId: booking.job_id, bookingId, subject: `Booking confirmed — ${jobTitle}`, html: layout(`<h1>Booking confirmed</h1><p>Your booking with ${escapeHtml(providerName)} is confirmed.</p><p>${escapeHtml(jobTitle)}<br>${escapeHtml(district(job.postcode))}<br>Agreed price: £${(Number(booking.amount_pence) / 100).toFixed(2).replace(/\.00$/, "")}</p>${cta(link(`/jobs/${job.public_token}`), "View booking")}`) });
  if (providerId) {
    const providerUser = (await admin.auth.admin.getUserById(providerId)).data.user;
    if (providerUser?.email) await sendMarketplaceTransactionalEmail({ eventType: "booking_confirmed_provider", dedupeKey: `booking_confirmed_provider:${booking.id}:${providerId}`, recipientUserId: providerId, recipientEmail: providerUser.email, jobId: booking.job_id, bookingId, subject: "Your offer was accepted", html: layout(`<h1>Your offer was accepted</h1><p>You've been booked for a ${escapeHtml(jobTitle)} job in ${escapeHtml(district(job.postcode))}.</p><p>Agreed price: £${(Number(booking.amount_pence) / 100).toFixed(2).replace(/\.00$/, "")}</p>${cta(link(`/work/jobs/${booking.job_id}`), "View booking")}`) });
  }
}

export async function notifyCustomerCompletionRequest(bookingId: string) {
  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin.from("marketplace_bookings").select("id,job_id,customer_id,marketplace_jobs(public_token,service,service_subtype)").eq("id", bookingId).maybeSingle();
  if (!booking) return;
  const job = Array.isArray(booking.marketplace_jobs) ? booking.marketplace_jobs[0] : booking.marketplace_jobs;
  const customer = booking.customer_id ? (await admin.from("marketplace_customers").select("auth_user_id").eq("id", booking.customer_id).maybeSingle()).data : null;
  const user = customer?.auth_user_id ? (await admin.auth.admin.getUserById(customer.auth_user_id)).data.user : null;
  if (!user?.email || !job) return;
  const customerAuthUserId = customer?.auth_user_id;
  if (!customerAuthUserId) return;
  const jobTitle = title(job);
  await sendMarketplaceTransactionalEmail({ eventType: "completion_confirmation_customer", dedupeKey: `completion_confirmation_customer:${booking.id}:${customerAuthUserId}`, recipientUserId: customerAuthUserId, recipientEmail: user.email, jobId: booking.job_id, bookingId, subject: `Please confirm your ${jobTitle} job is complete`, html: layout(`<h1>Your provider marked the job complete</h1><p>Please check the work and confirm completion, or report a problem if something needs attention.</p>${cta(link(`/jobs/${job.public_token}`), "Review the job")}`) });
}

export async function notifyCompletionOutcome(bookingId: string, outcome: "confirmed" | "issue_reported", transferStatus?: "paid" | "blocked" | "failed" | "already_processing") {
  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin.from("marketplace_bookings").select("id,job_id,provider_id,marketplace_jobs(service,service_subtype)").eq("id", bookingId).maybeSingle();
  if (!booking?.provider_id) return;
  const user = (await admin.auth.admin.getUserById(booking.provider_id)).data.user;
  if (!user?.email) return;
  const jobTitle = title(Array.isArray(booking.marketplace_jobs) ? booking.marketplace_jobs[0] : booking.marketplace_jobs || {});
  const confirmed = outcome === "confirmed";
  const transferCopy = transferStatus === "paid" || transferStatus === "already_processing" ? "Your provider transfer is being processed." : "Your payment needs attention and will be reviewed.";
  await sendMarketplaceTransactionalEmail({ eventType: confirmed ? "completion_confirmed_provider" : "completion_issue_provider", dedupeKey: `${confirmed ? "completion_confirmed_provider" : "completion_issue_provider"}:${booking.id}:${booking.provider_id}`, recipientUserId: booking.provider_id, recipientEmail: user.email, jobId: booking.job_id, bookingId, subject: confirmed ? "Job completed — payment processing" : "Payment on hold — customer reported a problem", html: layout(confirmed ? `<h1>Job completed</h1><p>The customer confirmed your ${escapeHtml(jobTitle)} job. ${transferCopy}</p>${cta(link(`/work/jobs/${booking.job_id}`), "View job")}` : `<h1>Payment on hold</h1><p>The customer reported a problem with the ${escapeHtml(jobTitle)} job. Provider payment is blocked while it is reviewed.</p>${cta(link(`/work/jobs/${booking.job_id}`), "View job")}`) });
}
