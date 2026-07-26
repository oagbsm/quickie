"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireBusinessUser } from "@/lib/business/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { londonLocalToUtc } from "@/lib/business/time";
import { hasTurnoverWindowRisk } from "@/lib/turnovers/status";
import { isImplausibleTurnoverDate } from "@/lib/turnovers/presentation";
import { sendCleanerInvitationEmail } from "@/lib/server/business-notifications";

const text = (form: FormData, name: string) =>
  String(form.get(name) || "").trim();
const optional = (form: FormData, name: string) => text(form, name) || null;

async function storeManualInviteLink(workerId: string, token: string, expiresAt: string) {
  const cookieStore = await cookies();
  cookieStore.set(`quickola-invite-${workerId}`, Buffer.from(JSON.stringify({ token, expiresAt })).toString("base64url"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 600,
    path: `/business/cleaners/${workerId}`,
  });
}

export async function addWorker(form: FormData) {
  const { supabase, accountId, role } = await requireBusinessUser();
  if (role !== "owner") redirect("/business/cleaners?error=forbidden");
  const displayName = text(form, "displayName");
  const email = optional(form, "email")?.toLowerCase() || null;
  const mobile = optional(form, "mobile");
  const preferred = text(form, "preferredContactMethod");
  if (
    !displayName ||
    !email ||
    !["email", "mobile"].includes(preferred)
  ) {
    redirect("/business/cleaners/new?error=required");
  }
  if (
    (preferred === "email" && !email) ||
    (preferred === "mobile" && !mobile)
  ) {
    redirect("/business/cleaners/new?error=preferred");
  }
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const { data: workerId, error } = await supabase.rpc(
    "create_worker_with_invitation",
    {
      target_account: accountId,
      target_name: displayName,
      target_company: optional(form, "companyName"),
      target_email: email,
      target_mobile: mobile,
      target_preferred_contact: preferred,
      target_token_hash: tokenHash,
      target_expiry: expiresAt,
    },
  );
  if (error || !workerId) {
    const code = error?.message.includes("duplicate_worker_contact")
      ? "duplicate"
      : "save";
    redirect(`/business/cleaners/new?error=${code}`);
  }
  const { data: account } = await supabase.from("business_accounts").select("name").eq("id", accountId).maybeSingle();
  const delivery = await sendCleanerInvitationEmail({ email, workspaceName: account?.name || "A Quickola cleaning team", invitationToken: token, expiresAt });
  if (!delivery.sent) {
    await storeManualInviteLink(workerId, token, expiresAt);
    redirect(`/business/cleaners/${workerId}?invited=1&email=failed&link=1`);
  }
  await supabase
    .from("activity_events")
    .update({
      metadata: { invitation_path: `/team/invite/[redacted]`, delivery: "email" },
    })
    .eq("worker_id", workerId)
    .eq("event_type", "cleaner_invited");
  if (text(form, "returnTo") === "onboarding") {
    await supabase
      .from("business_accounts")
      .update({
        onboarding_step: "complete",
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", accountId);
    revalidatePath("/business/dashboard");
    redirect("/business/dashboard");
  }
  revalidatePath("/business/cleaners");
  revalidatePath("/business/turnovers/new");
  revalidatePath("/business/activity");
  revalidatePath("/business/dashboard");
  await storeManualInviteLink(workerId, token, expiresAt);
  redirect(`/business/cleaners/${workerId}?invited=1&link=1`);
}

export async function skipCleanerOnboarding() {
  const { supabase, accountId } = await requireBusinessUser();
  await supabase
    .from("business_accounts")
    .update({
      onboarding_step: "complete",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", accountId);
  redirect("/business/dashboard");
}

export async function saveOnboardingStandard(form: FormData) {
  const { supabase, accountId } = await requireBusinessUser();
  const propertyId = text(form, "propertyId");
  const checkout = text(form, "defaultCheckoutTime");
  const checkin = text(form, "defaultCheckinTime");
  const duration = Number(text(form, "estimatedTurnoverMinutes"));
  if (!propertyId || !checkout || !checkin || !Number.isFinite(duration)) {
    redirect(
      `/business/onboarding?step=standard&property=${propertyId}&error=required`,
    );
  }
  const { error } = await supabase
    .from("properties")
    .update({
      default_checkout_time: checkout,
      default_checkin_time: checkin,
      estimated_turnover_minutes: duration,
      access_notes: optional(form, "accessNotes"),
      bed_configuration: optional(form, "bedConfiguration"),
      linen_requirements: optional(form, "linenRequirements"),
      key_return_instructions: optional(form, "keyReturnInstructions"),
      cleaning_notes: optional(form, "cleaningNotes"),
      required_completion_photos: Number(
        text(form, "requiredCompletionPhotos") || 4,
      ),
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId)
    .eq("account_id", accountId);
  if (error)
    redirect(
      `/business/onboarding?step=standard&property=${propertyId}&error=save`,
    );
  await supabase
    .from("business_accounts")
    .update({ onboarding_step: "cleaner" })
    .eq("id", accountId);
  redirect("/business/onboarding?step=cleaner");
}

export async function setWorkerStatus(form: FormData) {
  const { supabase, accountId } = await requireBusinessUser();
  const id = text(form, "workerId");
  const status = text(form, "status");
  if (!["active", "inactive"].includes(status)) return;
  await supabase
    .from("workers")
    .update({
      status,
      invitation_status: status === "inactive" ? "inactive" : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("account_id", accountId);
  revalidatePath("/business/cleaners");
  revalidatePath(`/business/cleaners/${id}`);
}

export async function createTurnover(form: FormData) {
  const { supabase, accountId, user } = await requireBusinessUser();
  const propertyId = text(form, "propertyId");
  const date = text(form, "date");
  if (isImplausibleTurnoverDate(date))
    redirect("/business/turnovers/new?error=date");
  let checkout: Date, access: Date, checkin: Date;
  try {
    checkout = londonLocalToUtc(date, text(form, "checkoutTime"));
    access = londonLocalToUtc(date, text(form, "accessTime"));
    checkin = londonLocalToUtc(date, text(form, "checkinTime"));
  } catch {
    redirect("/business/turnovers/new?error=schedule");
  }
  const duration = Number(text(form, "durationMinutes"));
  const workerId = optional(form, "workerId");
  const risk = hasTurnoverWindowRisk(checkout, checkin, duration);
  if (
    !propertyId ||
    !date ||
    !Number.isFinite(duration) ||
    checkout > access ||
    access >= checkin
  ) {
    redirect("/business/turnovers/new?error=schedule");
  }
  if (risk && form.get("riskAcknowledged") !== "on") {
    redirect("/business/turnovers/new?error=risk");
  }
  const { data: property } = await supabase
    .from("properties")
    .select(
      "id,nickname,postcode,required_completion_photos,linen_requirements",
    )
    .eq("id", propertyId)
    .eq("account_id", accountId)
    .eq("status", "active")
    .maybeSingle();
  if (!property) redirect("/business/turnovers/new?error=property");

  const { data: item, error } = await supabase
    .from("work_items")
    .insert({
      account_id: accountId,
      property_id: propertyId,
      property_public_name: property.nickname,
      property_general_area: property.postcode.split(/\s+/)[0],
      turnover_date: date,
      guest_checkout_at: checkout.toISOString(),
      access_start_at: access.toISOString(),
      next_checkin_at: checkin.toISOString(),
      estimated_duration_minutes: duration,
      cleaning_type: text(form, "cleaningType") || "standard_turnover",
      notes: optional(form, "notes"),
      linen_requirement:
        optional(form, "linenRequirement") || property.linen_requirements,
      required_evidence_count: property.required_completion_photos,
      risk_acknowledged: risk,
      status: workerId ? "awaiting_response" : "unassigned",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !item) redirect("/business/turnovers/new?error=save");

  const { data: template } = await supabase
    .from("checklist_templates")
    .select(
      "id,checklist_template_sections(id,title,position,checklist_template_tasks(id,label,description,position,response_type,mandatory,photo_required,note_required,blocking))",
    )
    .eq("property_id", propertyId)
    .eq("active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sections = (template?.checklist_template_sections || []) as Array<
    Record<string, unknown>
  >;
  const tasks = sections.flatMap((section) =>
    (
      (section.checklist_template_tasks || []) as Array<Record<string, unknown>>
    ).map((task) => ({
      account_id: accountId,
      work_item_id: item.id,
      source_task_id: task.id,
      section_title: section.title,
      label: task.label,
      description: task.description,
      position: Number(section.position) * 100 + Number(task.position),
      response_type: task.response_type,
      mandatory: task.mandatory,
      photo_required: task.photo_required,
      note_required: task.note_required,
      blocking: task.blocking,
    })),
  );
  if (tasks.length) {
    const { error: checklistError } = await supabase.from("checklist_tasks").insert(tasks);
    if (checklistError) {
      await supabase.from("work_items").delete().eq("id", item.id).eq("account_id", accountId);
      redirect("/business/turnovers/new?error=checklist");
    }
  }
  if (workerId)
    await supabase.rpc("assign_work_item_worker", {
      target_work_item: item.id,
      target_worker: workerId,
    });
  await supabase.from("activity_events").insert({
    account_id: accountId,
    work_item_id: item.id,
    property_id: propertyId,
    actor_user_id: user.id,
    event_type: "turnover_created",
    description: "Turnover created",
  });
  revalidatePath("/business/dashboard");
  revalidatePath("/business/turnovers");
  redirect(`/business/turnovers/${item.id}?created=1`);
}

export async function transitionTurnover(form: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = text(form, "turnoverId");
  const next = text(form, "nextStatus");
  const { error } = await supabase.rpc("transition_work_item", {
    target_work_item: id,
    next_status: next,
  });
  if (error)
    redirect(
      `/cleaner/turnovers/${id}?error=${encodeURIComponent(error.message)}`,
    );
  revalidatePath(`/cleaner/turnovers/${id}`);
  revalidatePath(`/business/turnovers/${id}`);
  revalidatePath("/business/dashboard");
}

export async function updateChecklistTask(form: FormData) {
  const supabase = await createSupabaseServerClient();
  const taskId = text(form, "taskId");
  const turnoverId = text(form, "turnoverId");
  await supabase
    .from("checklist_tasks")
    .update({
      completed: form.get("completed") === "on",
      response: optional(form, "response"),
      note: optional(form, "note"),
      completed_at:
        form.get("completed") === "on" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("work_item_id", turnoverId);
  await supabase.rpc("evaluate_work_item_readiness", {
    target_work_item: turnoverId,
  });
  revalidatePath(`/cleaner/turnovers/${turnoverId}`);
}

export async function reportIssue(form: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/business/sign-in");
  const workItemId = text(form, "turnoverId");
  const { data: item } = await supabase
    .from("work_items")
    .select("account_id")
    .eq("id", workItemId)
    .maybeSingle();
  if (!item) return;
  const { data: issue } = await supabase
    .from("operational_issues")
    .insert({
      account_id: item.account_id,
      work_item_id: workItemId,
      issue_type: text(form, "issueType"),
      severity: text(form, "severity"),
      description: text(form, "description"),
      blocking: form.get("blocking") === "on",
      created_by: user.id,
    })
    .select("id")
    .single();
  const file = form.get("photo");
  if (
    issue &&
    file instanceof File &&
    file.size > 0 &&
    file.size <= 10_485_760 &&
    ["image/jpeg", "image/png", "image/webp", "image/heic"].includes(file.type)
  ) {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.replace(/[^a-z0-9]/gi, "")
        .toLowerCase() || "jpg";
    const path = `${item.account_id}/${workItemId}/issues/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("turnover-evidence")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (!uploadError)
      await supabase.from("evidence_submissions").insert({
        account_id: item.account_id,
        work_item_id: workItemId,
        issue_id: issue.id,
        uploader_id: user.id,
        storage_path: path,
        evidence_type: "issue_photo",
        caption: `Evidence for ${text(form, "issueType")}`,
      });
  }
  await supabase.rpc("evaluate_work_item_readiness", {
    target_work_item: workItemId,
  });
  revalidatePath(`/cleaner/turnovers/${workItemId}`);
  revalidatePath("/business/issues");
}

export async function resolveIssue(form: FormData) {
  const { supabase, accountId, user } = await requireBusinessUser();
  const issueId = text(form, "issueId");
  const turnoverId = text(form, "turnoverId");
  await supabase
    .from("operational_issues")
    .update({
      status: "resolved",
      resolution: text(form, "resolution"),
      resolved_at: new Date().toISOString(),
    })
    .eq("id", issueId)
    .eq("account_id", accountId);
  await supabase.from("activity_events").insert({
    account_id: accountId,
    work_item_id: turnoverId,
    actor_user_id: user.id,
    event_type: "issue_resolved",
    description: "An operational issue was resolved",
    metadata: { issue_id: issueId },
  });
  await supabase.rpc("evaluate_work_item_readiness", {
    target_work_item: turnoverId,
  });
  revalidatePath("/business/issues");
  revalidatePath(`/business/turnovers/${turnoverId}`);
}

export async function updateIssue(form: FormData) {
  const { supabase, accountId, user } = await requireBusinessUser();
  const issueId = text(form, "issueId");
  const turnoverId = text(form, "turnoverId");
  const action = text(form, "issueAction");
  const { data: issue } = await supabase
    .from("operational_issues")
    .select("id,blocking,status")
    .eq("id", issueId)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!issue) return;
  if (action === "acknowledge") {
    await supabase
      .from("operational_issues")
      .update({
        status: "acknowledged",
        owner_response: optional(form, "ownerResponse"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId)
      .eq("account_id", accountId);
    await supabase.from("activity_events").insert({
      account_id: accountId,
      work_item_id: turnoverId,
      actor_user_id: user.id,
      event_type: "issue_acknowledged",
      description: "The operator acknowledged an issue",
      metadata: { issue_id: issueId },
    });
  }
  if (action === "downgrade" && issue.blocking) {
    const reason = text(form, "ownerResponse");
    if (!reason) return;
    await supabase
      .from("operational_issues")
      .update({
        blocking: false,
        owner_response: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId)
      .eq("account_id", accountId);
    await supabase.from("activity_events").insert({
      account_id: accountId,
      work_item_id: turnoverId,
      actor_user_id: user.id,
      event_type: "issue_downgraded",
      description: "The operator changed a blocking issue to non-blocking",
      metadata: { issue_id: issueId, reason },
    });
  }
  await supabase.rpc("evaluate_work_item_readiness", {
    target_work_item: turnoverId,
  });
  revalidatePath("/business/issues");
  revalidatePath(`/business/turnovers/${turnoverId}`);
}

export async function updateWorkspaceSettings(form: FormData) {
  const { supabase, accountId, user } = await requireBusinessUser();
  const workspaceName = text(form, "workspaceName");
  const fullName = text(form, "fullName");
  const defaultDuration = Number(text(form, "defaultTurnoverMinutes") || 180);
  if (workspaceName.length < 2 || fullName.length < 2) return;
  await Promise.all([
    supabase
      .from("business_accounts")
      .update({
        name: workspaceName,
        timezone: text(form, "timezone") || "Europe/London",
        default_checkout_time: text(form, "defaultCheckoutTime") || "11:00",
        default_checkin_time: text(form, "defaultCheckinTime") || "15:00",
        default_turnover_minutes: Number.isFinite(defaultDuration)
          ? defaultDuration
          : 180,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId),
    supabase
      .from("business_members")
      .update({ full_name: fullName })
      .eq("account_id", accountId)
      .eq("user_id", user.id),
  ]);
  revalidatePath("/business/settings");
  revalidatePath("/business/dashboard");
}

export async function setPropertyDefaultWorker(form: FormData) {
  const { supabase, accountId } = await requireBusinessUser();
  const propertyId = text(form, "propertyId");
  const workerId = text(form, "workerId");
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!property) return;
  await supabase
    .from("property_workers")
    .delete()
    .eq("property_id", propertyId)
    .eq("account_id", accountId)
    .eq("is_default", true);
  if (workerId)
    await supabase.from("property_workers").upsert({
      property_id: propertyId,
      worker_id: workerId,
      account_id: accountId,
      is_default: true,
    });
  revalidatePath(`/business/properties/${propertyId}`);
  revalidatePath(`/business/properties/${propertyId}/cleaners`);
}

export async function acceptWorkerInvitation(form: FormData) {
  const supabase = await createSupabaseServerClient();
  const token = text(form, "token");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(
      `/business/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`,
    );
  const confirmedName = text(form, "confirmedName");
  if (confirmedName.length < 2 || confirmedName.length > 120)
    redirect(`/invite/${token}?error=name`);
  const { error } = await supabase.rpc("accept_worker_invitation", {
    raw_token: token,
    confirmed_name: confirmedName,
  });
  if (error) redirect(`/invite/${token}?error=invalid`);
  redirect("/cleaner/today");
}

export async function uploadEvidence(form: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/business/sign-in");
  const turnoverId = text(form, "turnoverId");
  const taskId = optional(form, "taskId");
  const type = text(form, "evidenceType") || "completion_photo";
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > 10_485_760 ||
    !["image/jpeg", "image/png", "image/webp", "image/heic"].includes(file.type)
  ) {
    redirect(`/cleaner/turnovers/${turnoverId}?error=upload`);
  }
  const { data: item } = await supabase
    .from("work_items")
    .select("account_id")
    .eq("id", turnoverId)
    .maybeSingle();
  if (!item) return;
  const extension =
    file.name
      .split(".")
      .pop()
      ?.replace(/[^a-z0-9]/gi, "")
      .toLowerCase() || "jpg";
  const path = `${item.account_id}/${turnoverId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("turnover-evidence")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) redirect(`/cleaner/turnovers/${turnoverId}?error=upload`);
  await supabase.from("evidence_submissions").insert({
    account_id: item.account_id,
    work_item_id: turnoverId,
    checklist_task_id: taskId,
    uploader_id: user.id,
    storage_path: path,
    evidence_type: type,
    caption: optional(form, "caption"),
  });
  await supabase.rpc("evaluate_work_item_readiness", {
    target_work_item: turnoverId,
  });
  revalidatePath(`/cleaner/turnovers/${turnoverId}`);
  revalidatePath(`/business/turnovers/${turnoverId}`);
}

export async function addChecklistTask(form: FormData) {
  const { supabase, accountId } = await requireBusinessUser();
  const propertyId = text(form, "propertyId");
  const label = text(form, "label");
  if (!label) return;
  let { data: template } = await supabase
    .from("checklist_templates")
    .select("id")
    .eq("property_id", propertyId)
    .eq("account_id", accountId)
    .eq("active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!template) {
    const result = await supabase
      .from("checklist_templates")
      .insert({
        account_id: accountId,
        property_id: propertyId,
        name: "Guest-ready turnover standard",
      })
      .select("id")
      .single();
    template = result.data;
  }
  if (!template) return;
  let { data: section } = await supabase
    .from("checklist_template_sections")
    .select("id")
    .eq("template_id", template.id)
    .eq("title", text(form, "sectionTitle") || "Custom tasks")
    .maybeSingle();
  if (!section) {
    const { count } = await supabase
      .from("checklist_template_sections")
      .select("id", { count: "exact", head: true })
      .eq("template_id", template.id);
    const result = await supabase
      .from("checklist_template_sections")
      .insert({
        template_id: template.id,
        title: text(form, "sectionTitle") || "Custom tasks",
        position: (count || 0) + 1,
      })
      .select("id")
      .single();
    section = result.data;
  }
  if (!section) return;
  const { count } = await supabase
    .from("checklist_template_tasks")
    .select("id", { count: "exact", head: true })
    .eq("section_id", section.id);
  await supabase.from("checklist_template_tasks").insert({
    section_id: section.id,
    label,
    position: (count || 0) + 1,
    response_type: text(form, "responseType") || "checkbox",
    mandatory: form.get("mandatory") === "on",
    photo_required: form.get("photoRequired") === "on",
    note_required: form.get("noteRequired") === "on",
    blocking: form.get("blocking") === "on",
  });
  revalidatePath(`/business/properties/${propertyId}`);
}

export async function deleteChecklistTask(form: FormData) {
  const { supabase, accountId } = await requireBusinessUser();
  const propertyId = text(form, "propertyId");
  const taskId = text(form, "taskId");
  const { data: task } = await supabase
    .from("checklist_template_tasks")
    .select(
      "id,checklist_template_sections!inner(checklist_templates!inner(account_id,property_id))",
    )
    .eq("id", taskId)
    .maybeSingle();
  const section = Array.isArray(task?.checklist_template_sections)
    ? task?.checklist_template_sections[0]
    : task?.checklist_template_sections;
  const template = Array.isArray(section?.checklist_templates)
    ? section?.checklist_templates[0]
    : section?.checklist_templates;
  if (
    template?.account_id === accountId &&
    template?.property_id === propertyId
  )
    await supabase.from("checklist_template_tasks").delete().eq("id", taskId);
  revalidatePath(`/business/properties/${propertyId}`);
}

export async function moveChecklistTask(form: FormData) {
  const { supabase } = await requireBusinessUser();
  const propertyId = text(form, "propertyId");
  const taskId = text(form, "taskId");
  const direction = text(form, "direction");
  if (!propertyId || !taskId || !["up", "down"].includes(direction)) return;
  await supabase.rpc("move_checklist_template_task", {
    target_task: taskId,
    move_direction: direction,
  });
  revalidatePath(`/business/properties/${propertyId}`);
}

export async function markNotificationRead(form: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = text(form, "notificationId");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !id) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_user_id", user.id);
  revalidatePath("/business/dashboard");
  revalidatePath("/cleaner/today");
}

export async function markAllNotificationsRead() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_user_id", user.id)
    .is("read_at", null);
  revalidatePath("/business/dashboard");
  revalidatePath("/cleaner/today");
}

export async function assignWorker(form: FormData) {
  const { supabase } = await requireBusinessUser();
  const turnoverId = text(form, "turnoverId");
  const workerId = text(form, "workerId");
  if (!turnoverId || !workerId) return;
  const { error } = await supabase.rpc("assign_work_item_worker", {
    target_work_item: turnoverId,
    target_worker: workerId,
  });
  if (error)
    redirect(
      `/business/turnovers/${turnoverId}?error=${encodeURIComponent(error.message)}`,
    );
  revalidatePath("/business/dashboard");
  revalidatePath("/business/turnovers");
  revalidatePath(`/business/turnovers/${turnoverId}`);
}

export async function cancelAssignment(form: FormData) {
  const { supabase } = await requireBusinessUser();
  const turnoverId = text(form, "turnoverId");
  if (!turnoverId) return;
  await supabase.rpc("cancel_work_item_assignment", {
    target_work_item: turnoverId,
  });
  revalidatePath("/business/dashboard");
  revalidatePath("/business/turnovers");
  revalidatePath(`/business/turnovers/${turnoverId}`);
}

export async function revokeWorkerInvitation(form: FormData) {
  const { supabase, accountId } = await requireBusinessUser();
  const workerId = text(form, "workerId");
  await supabase
    .from("worker_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("worker_id", workerId)
    .eq("account_id", accountId)
    .is("accepted_at", null);
  await supabase
    .from("workers")
    .update({
      invitation_status: "revoked",
      updated_at: new Date().toISOString(),
    })
    .eq("id", workerId)
    .eq("account_id", accountId)
    .neq("invitation_status", "accepted");
  revalidatePath(`/business/cleaners/${workerId}`);
  revalidatePath("/business/cleaners");
}

export async function resendWorkerInvitation(form: FormData) {
  const { supabase, accountId, user, role } = await requireBusinessUser();
  if (role !== "owner") redirect("/business/cleaners?error=forbidden");
  const workerId = text(form, "workerId");
  const { data: worker } = await supabase
    .from("workers")
    .select("id,invitation_status,email")
    .eq("id", workerId)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!worker || worker.invitation_status === "accepted") return;
  const { data: latest } = await supabase
    .from("worker_invitations")
    .select("created_at")
    .eq("worker_id", workerId)
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest && Date.now() - new Date(latest.created_at).getTime() < 60_000)
    redirect(`/business/cleaners/${workerId}?error=rate_limited`);
  await supabase
    .from("worker_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("worker_id", workerId)
    .eq("account_id", accountId)
    .is("accepted_at", null);
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  await supabase.from("worker_invitations").insert({
    account_id: accountId,
    worker_id: workerId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: user.id,
  });
  await supabase
    .from("workers")
    .update({
      invitation_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", workerId)
    .eq("account_id", accountId);
  const { data: account } = await supabase.from("business_accounts").select("name").eq("id", accountId).maybeSingle();
  const delivery = worker.email ? await sendCleanerInvitationEmail({ email: worker.email, workspaceName: account?.name || "A Quickola cleaning team", invitationToken: token, expiresAt }) : { sent: false as const };
  if (!delivery.sent) {
    await storeManualInviteLink(workerId, token, expiresAt);
    redirect(`/business/cleaners/${workerId}?resent=1&email=failed&link=1`);
  }
  await storeManualInviteLink(workerId, token, expiresAt);
  redirect(`/business/cleaners/${workerId}?resent=1&link=1`);
}

export async function generateWorkerInviteLink(form: FormData) {
  const { supabase, accountId, user, role } = await requireBusinessUser();
  if (role !== "owner") redirect("/business/cleaners?error=forbidden");
  const workerId = text(form, "workerId");
  const { data: worker } = await supabase.from("workers").select("id,invitation_status").eq("id", workerId).eq("account_id", accountId).maybeSingle();
  if (!worker || worker.invitation_status !== "pending") redirect("/business/cleaners");
  const { data: invitation } = await supabase.from("worker_invitations").select("id,created_at").eq("worker_id", workerId).eq("account_id", accountId).is("accepted_at", null).is("revoked_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (invitation && Date.now() - new Date(invitation.created_at).getTime() < 60_000) redirect(`/business/cleaners/${workerId}?error=rate_limited`);
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  if (invitation) {
    await supabase.from("worker_invitations").update({ token_hash: tokenHash, expires_at: expiresAt, revoked_at: null }).eq("id", invitation.id).eq("account_id", accountId);
  } else {
    await supabase.from("worker_invitations").insert({ account_id: accountId, worker_id: workerId, token_hash: tokenHash, expires_at: expiresAt, created_by: user.id });
  }
  await storeManualInviteLink(workerId, token, expiresAt);
  redirect(`/business/cleaners/${workerId}?manual=1&link=1`);
}
