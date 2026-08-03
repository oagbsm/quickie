"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireBusinessUser } from "@/lib/business/auth";
import { requireCleanerUser } from "@/lib/cleaner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { londonLocalToUtc } from "@/lib/business/time";
import { hasTurnoverWindowRisk } from "@/lib/turnovers/status";
import { isImplausibleTurnoverDate } from "@/lib/turnovers/presentation";
import { sendCleanerAssignmentEmail, sendCleanerInvitationEmail, sendOperatorTurnoverEmail } from "@/lib/server/business-notifications";
import { isSupportedTurnoverDuration } from "@/lib/business/turnover-validation";

const text = (form: FormData, name: string) =>
  String(form.get(name) || "").trim();
const optional = (form: FormData, name: string) => text(form, name) || null;
const normaliseEmail = (value: string) => value.trim().toLowerCase();

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

async function createWorkerAndInvite({
  supabase,
  accountId,
  displayName,
  email,
  mobile,
  companyName,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  accountId: string;
  displayName: string;
  email: string;
  mobile: string | null;
  companyName: string | null;
}) {
  const normalisedEmail = normaliseEmail(email);
  const { data: existingWorker, error: existingWorkerError } = await supabase
    .from("workers")
    .select("id,invitation_status")
    .eq("account_id", accountId)
    .ilike("email", normalisedEmail)
    .neq("status", "inactive")
    .maybeSingle();
  if (existingWorkerError) return { error: "lookup" };
  if (existingWorker) return { workerId: existingWorker.id, existing: true, deliverySent: existingWorker.invitation_status === "accepted" };
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const preferred = "email";
  const { data: workerId, error } = await supabase.rpc(
    "create_worker_with_invitation",
    {
      target_account: accountId,
      target_name: displayName,
      target_company: companyName,
      target_email: normalisedEmail,
      target_mobile: mobile,
      target_preferred_contact: preferred,
      target_token_hash: tokenHash,
      target_expiry: expiresAt,
    },
  );
  if (error || !workerId) return { error: error?.message || "save" };
  const { data: account } = await supabase.from("business_accounts").select("name").eq("id", accountId).maybeSingle();
  const delivery = await sendCleanerInvitationEmail({ accountId, workerId, email, workspaceName: account?.name || "Your cleaning team", invitationToken: token, expiresAt });
  return { workerId, token, expiresAt, deliverySent: delivery.sent };
}

export async function addWorker(form: FormData) {
  const { supabase, accountId, role } = await requireBusinessUser();
  if (role !== "owner") redirect("/business/cleaners?error=forbidden");
  const { data: onboardingAccount, error: onboardingStateError } = await supabase
    .from("business_accounts")
    .select("onboarding_step,onboarding_completed_at")
    .eq("id", accountId)
    .maybeSingle();
  if (onboardingStateError) redirect("/business/cleaners/new?error=save");
  if (onboardingAccount?.onboarding_step === "complete" || onboardingAccount?.onboarding_completed_at)
    redirect("/business/dashboard");
  const displayName = text(form, "displayName");
  const email = optional(form, "email") ? normaliseEmail(optional(form, "email")!) : null;
  const mobile = optional(form, "mobile");
  if (!displayName || !email || !/^\S+@\S+\.\S+$/.test(email)) {
    redirect("/business/cleaners/new?error=required");
  }
  const created = await createWorkerAndInvite({ supabase, accountId, displayName, email, mobile, companyName: optional(form, "companyName") });
  if (!created.workerId) {
    const code = created.error?.includes("duplicate_worker_contact")
      ? "duplicate"
      : "save";
    redirect(`/business/cleaners/new?error=${code}`);
  }
  const workerId = created.workerId;
  if (created.existing) {
    if (text(form, "returnTo") === "onboarding") {
      await supabase.from("business_accounts").update({ onboarding_step: "complete", onboarding_completed_at: new Date().toISOString() }).eq("id", accountId);
      redirect("/business/dashboard");
    }
    redirect(`/business/cleaners/${workerId}?existing=1`);
  }
  const token = created.token;
  const expiresAt = created.expiresAt;
  const deliverySent = created.deliverySent;
  if (!deliverySent) {
    await storeManualInviteLink(workerId, token!, expiresAt!);
    redirect(`/business/cleaners/${workerId}?invited=1&email=failed&link=1`);
  }
  await supabase
    .from("activity_events")
    .update({
      metadata: { invitation_path: `/invite/[redacted]`, delivery: "email" },
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
  await storeManualInviteLink(workerId, token!, expiresAt!);
  redirect(`/business/cleaners/${workerId}?invited=1&link=1`);
}

export async function addWorkerForTurnover(form: FormData) {
  const { supabase, accountId, role } = await requireBusinessUser();
  const turnoverId = text(form, "turnoverId");
  if (role !== "owner" || !turnoverId) return;
  const { data: turnover } = await supabase.from("work_items").select("id").eq("id", turnoverId).eq("account_id", accountId).maybeSingle();
  if (!turnover) return;
  const displayName = text(form, "displayName");
  const email = optional(form, "email") ? normaliseEmail(optional(form, "email")!) : null;
  if (!displayName || !email || !/^\S+@\S+\.\S+$/.test(email)) redirect(`/business/turnovers/${turnoverId}?error=cleaner_required`);
  const created = await createWorkerAndInvite({ supabase, accountId, displayName, email, mobile: optional(form, "mobile"), companyName: optional(form, "companyName") });
  const workerId = created.workerId;
  if (!workerId) redirect(`/business/turnovers/${turnoverId}?error=cleaner_${created.error?.includes("duplicate_worker_contact") ? "duplicate" : "save"}`);
  if (created.existing) redirect(`/business/turnovers/${turnoverId}?error=cleaner_exists&workerId=${encodeURIComponent(workerId)}`);
  if (!created.deliverySent) await storeManualInviteLink(workerId, created.token!, created.expiresAt!);
  await supabase.from("activity_events").update({ metadata: { invitation_path: "/invite/[redacted]", delivery: created.deliverySent ? "email" : "manual" } }).eq("worker_id", workerId).eq("event_type", "cleaner_invited");
  revalidatePath(`/business/turnovers/${turnoverId}`);
  redirect(`/business/turnovers/${turnoverId}?workerAdded=1&workerId=${encodeURIComponent(workerId)}`);
}

export async function skipCleanerOnboarding() {
  const { supabase, accountId } = await requireBusinessUser();
  const { data: onboardingAccount, error: onboardingStateError } = await supabase
    .from("business_accounts")
    .select("onboarding_step,onboarding_completed_at")
    .eq("id", accountId)
    .maybeSingle();
  if (onboardingStateError) redirect("/business/dashboard?error=onboarding");
  if (onboardingAccount?.onboarding_step === "complete" || onboardingAccount?.onboarding_completed_at)
    redirect("/business/dashboard");
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
  const { data: onboardingAccount, error: onboardingStateError } = await supabase
    .from("business_accounts")
    .select("onboarding_step,onboarding_completed_at")
    .eq("id", accountId)
    .maybeSingle();
  if (onboardingStateError) redirect("/business/onboarding?step=standard&error=state");
  if (onboardingAccount?.onboarding_step === "complete" || onboardingAccount?.onboarding_completed_at)
    redirect("/business/dashboard");
  const propertyId = text(form, "propertyId");
  const checkout = text(form, "defaultCheckoutTime");
  const checkin = text(form, "defaultCheckinTime");
  const duration = Number(text(form, "estimatedTurnoverMinutes"));
  if (!propertyId || !checkout || !checkin || !isSupportedTurnoverDuration(duration)) {
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
      window_end_at: checkin.toISOString(),
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
  if (workerId) {
    const [{ data: assigned }, { data: worker }] = await Promise.all([
      supabase.from("assignments").select("id").eq("work_item_id", item.id).eq("worker_id", workerId).eq("status", "pending").order("assigned_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("workers").select("email,display_name").eq("id", workerId).eq("account_id", accountId).maybeSingle(),
    ]);
    if (assigned && worker?.email)
      await sendCleanerAssignmentEmail({ accountId, turnoverId: item.id, workerId, cleanerEmail: worker.email, cleanerName: worker.display_name, propertyName: property.nickname, turnoverDate: date, checkoutAt: checkout.toISOString(), accessStartAt: access.toISOString(), deadlineAt: checkin.toISOString() });
  }
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
  const { supabase } = await requireCleanerUser();
  const id = text(form, "turnoverId");
  const next = text(form, "nextStatus");
  const { data: before } = await supabase.from("work_items").select("account_id,property_public_name,turnover_date,assignments(status,workers(display_name))").eq("id", id).maybeSingle();
  const { error } = await supabase.rpc("transition_work_item", {
    target_work_item: id,
    next_status: next,
  });
  if (error) redirect(`/cleaner/turnovers/${id}?error=update`);
  const { data: turnover } = await supabase.from("work_items").select("account_id,status,property_public_name,turnover_date,ready_at,readiness_result,checklist_tasks(completed),evidence_submissions(id),assignments(status,workers(display_name))").eq("id", id).maybeSingle();
  if (turnover || before) {
    const context = turnover || before;
    if (!context) return;
    const assignment = (context?.assignments || []).find((entry: { status: string }) => ["pending", "accepted", "declined"].includes(entry.status));
    const assignedWorker = Array.isArray(assignment?.workers) ? assignment.workers[0] : assignment?.workers;
    const cleanerName = assignedWorker?.display_name || "Assigned cleaner";
    if (["accepted", "declined", "arrived"].includes(next))
      await sendOperatorTurnoverEmail({ accountId: context.account_id, turnoverId: id, eventType: `turnover_${next}`, idempotencyKey: `turnover_${id}:${next}`, subject: next === "accepted" ? "Cleaner accepted turnover" : next === "declined" ? "Cleaner declined turnover" : "Cleaner arrived", cleanerName, propertyName: context.property_public_name, turnoverDate: context.turnover_date, summary: next === "declined" ? "Please reassign this turnover." : `${cleanerName} updated the turnover at ${new Date().toLocaleString("en-GB")}.` });
    if (!turnover) return;
    if (turnover.status === "action_required") {
      const blockerKey = crypto.createHash("sha256").update(JSON.stringify(turnover.readiness_result || {})).digest("hex");
      await sendOperatorTurnoverEmail({ accountId: turnover.account_id, turnoverId: id, eventType: "action_required", idempotencyKey: `action_required:${id}:${blockerKey}`, subject: "Turnover needs attention", cleanerName, propertyName: turnover.property_public_name, turnoverDate: turnover.turnover_date, summary: JSON.stringify(turnover.readiness_result || "Completion requirements remain outstanding") });
    }
    if (turnover.status === "ready")
      await sendOperatorTurnoverEmail({ accountId: turnover.account_id, turnoverId: id, eventType: "property_ready", idempotencyKey: `property_ready:${id}`, subject: "Property ready", cleanerName, propertyName: turnover.property_public_name, turnoverDate: turnover.turnover_date, summary: `Completed at ${turnover.ready_at || new Date().toISOString()}.`, completedCount: (turnover.checklist_tasks || []).filter((task: { completed: boolean }) => task.completed).length, evidenceCount: (turnover.evidence_submissions || []).length });
  }
  revalidatePath(`/cleaner/turnovers/${id}`);
  revalidatePath(`/business/turnovers/${id}`);
  revalidatePath("/business/dashboard");
}

export async function updateChecklistTask(form: FormData) {
  const { supabase } = await requireCleanerUser();
  const taskId = text(form, "taskId");
  const turnoverId = text(form, "turnoverId");
  const { data: item } = await supabase.from("work_items").select("status").eq("id", turnoverId).maybeSingle();
  if (!item || !["in_progress", "action_required"].includes(item.status))
    redirect(`/cleaner/turnovers/${turnoverId}?error=pre_arrival`);
  const { data: task } = await supabase.from("checklist_tasks").select("mandatory,response_type,photo_required,note_required,label").eq("id", taskId).eq("work_item_id", turnoverId).maybeSingle();
  if (!task) redirect(`/cleaner/turnovers/${turnoverId}?error=task`);
  const completed = form.get("completed") === "on";
  const response = optional(form, "response");
  const note = optional(form, "note");
  if (completed && (task.note_required && !note || task.response_type !== "checkbox" && !response))
    redirect(`/cleaner/turnovers/${turnoverId}?error=task_requirements`);
  if (completed && (task.photo_required || /key.*return/i.test(task.label || ""))) {
    const { data: photo } = await supabase.from("evidence_submissions").select("id").eq("work_item_id", turnoverId).eq("checklist_task_id", taskId).limit(1).maybeSingle();
    if (!photo) redirect(`/cleaner/turnovers/${turnoverId}?error=task_photo_required`);
  }
  if (completed && task.response_type === "yes_no" && !["yes", "no"].includes(response || "")) redirect(`/cleaner/turnovers/${turnoverId}?error=task_requirements`);
  if (completed && task.response_type === "pass_fail" && !["pass", "fail"].includes(response || "")) redirect(`/cleaner/turnovers/${turnoverId}?error=task_requirements`);
  const { error: updateError } = await supabase
    .from("checklist_tasks")
    .update({
      completed,
      response,
      note,
      completed_at:
        completed ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("work_item_id", turnoverId);
  if (updateError) redirect(`/cleaner/turnovers/${turnoverId}?error=task_save`);
  await supabase.rpc("evaluate_work_item_readiness", {
    target_work_item: turnoverId,
  });
  revalidatePath(`/cleaner/turnovers/${turnoverId}`);
}

export async function reportIssue(form: FormData) {
  const { supabase, user } = await requireCleanerUser();
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
  if (issue) {
    const { data: context } = await supabase.from("work_items").select("account_id,property_public_name,turnover_date,assignments(workers(display_name))").eq("id", workItemId).maybeSingle();
    const issueAssignment = context?.assignments?.[0];
    const issueWorker = Array.isArray(issueAssignment?.workers) ? issueAssignment.workers[0] : issueAssignment?.workers;
    const cleanerName = issueWorker?.display_name || "Assigned cleaner";
    if (context)
      await sendOperatorTurnoverEmail({ accountId: context.account_id, turnoverId: workItemId, eventType: "action_required", idempotencyKey: `action_required:issue:${issue.id}`, subject: "Action required on turnover", cleanerName, propertyName: context.property_public_name, turnoverDate: context.turnover_date, summary: `${text(form, "issueType")}: ${text(form, "description")}` });
  }
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

export async function uploadEvidence(form: FormData) {
  const { supabase, user } = await requireCleanerUser();
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
    redirect(`/cleaner/turnovers/${turnoverId}?error=invalid_file`);
  }
  const { data: item } = await supabase
    .from("work_items")
    .select("account_id,status")
    .eq("id", turnoverId)
    .maybeSingle();
  if (!item) redirect(`/cleaner/turnovers/${turnoverId}?error=not_found`);
  if (!["in_progress", "action_required"].includes(item.status))
    redirect(`/cleaner/turnovers/${turnoverId}?error=pre_arrival`);
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
  if (error) redirect(`/cleaner/turnovers/${turnoverId}?error=storage`);
  const { error: evidenceError } = await supabase.from("evidence_submissions").insert({
    account_id: item.account_id,
    work_item_id: turnoverId,
    checklist_task_id: taskId,
    uploader_id: user.id,
    storage_path: path,
    evidence_type: type,
    caption: optional(form, "caption"),
  });
  if (evidenceError) redirect(`/cleaner/turnovers/${turnoverId}?error=evidence`);
  if (taskId && ["completion_photo", "key_return"].includes(type)) {
    const { data: task } = await supabase
      .from("checklist_tasks")
      .select("id,response_type,note_required,note,response,completed,photo_required,label")
      .eq("id", taskId)
      .eq("work_item_id", turnoverId)
      .maybeSingle();
    const response = optional(form, "response");
    const note = optional(form, "note");
    const responseReady = !task || task.response_type === "checkbox" || Boolean(response || task.response);
    const noteReady = !task || !task.note_required || Boolean(note || task.note?.trim());
    if (task && task.response_type === "yes_no" && !["yes", "no"].includes(response || task.response || "")) redirect(`/cleaner/turnovers/${turnoverId}?error=task_requirements`);
    if (task && task.response_type === "pass_fail" && !["pass", "fail"].includes(response || task.response || "")) redirect(`/cleaner/turnovers/${turnoverId}?error=task_requirements`);
    if (task && !task.completed && responseReady && noteReady) await supabase.from("checklist_tasks").update({ completed: true, response: response || task.response, note: note || task.note, completed_by: user.id, completed_at: new Date().toISOString() }).eq("id", task.id).eq("work_item_id", turnoverId);
  }
  await supabase.rpc("evaluate_work_item_readiness", {
    target_work_item: turnoverId,
  });
  revalidatePath(`/cleaner/turnovers/${turnoverId}`);
  revalidatePath(`/business/turnovers/${turnoverId}`);
}

export async function completeTestTurnover(form: FormData) {
  const turnoverId = text(form, "turnoverId");
  if (process.env.NODE_ENV !== "development" || process.env.QUICKOLA_TEST_SHORTCUTS !== "1")
    redirect(`/cleaner/turnovers/${turnoverId}?error=shortcut_unavailable`);
  const { supabase, user, workerId } = await requireCleanerUser();
  const { data: item } = await supabase.from("work_items").select("id,account_id,status,required_evidence_count,assignments!inner(worker_id,status)").eq("id", turnoverId).eq("assignments.worker_id", workerId).maybeSingle();
  const assignment = Array.isArray(item?.assignments) ? item.assignments[0] : item?.assignments;
  if (!item || !assignment || !["pending", "accepted"].includes(assignment.status) || !["arrived", "in_progress", "action_required"].includes(item.status))
    redirect(`/cleaner/turnovers/${turnoverId}?error=shortcut_forbidden`);
  const { data: tasks } = await supabase.from("checklist_tasks").select("id,label,mandatory,response_type,note_required,note,response,completed,photo_required").eq("work_item_id", turnoverId);
  const { data: evidence } = await supabase.from("evidence_submissions").select("checklist_task_id,evidence_type").eq("work_item_id", turnoverId);
  const marker = "[DEVELOPMENT TEST EVIDENCE]";
  for (const task of tasks || []) {
    const patch: Record<string, string | boolean> = {};
    if (task.response_type !== "checkbox" && !task.response) patch.response = task.response_type === "yes_no" ? "yes" : "pass";
    if (task.note_required && !task.note?.trim()) patch.note = "Development test completion";
    if (!task.completed && (!task.note_required || patch.note) && (task.response_type === "checkbox" || patch.response || task.response)) {
      patch.completed = true;
      patch.completed_by = user.id;
      patch.completed_at = new Date().toISOString();
    }
    if (Object.keys(patch).length) await supabase.from("checklist_tasks").update(patch).eq("id", task.id).eq("work_item_id", turnoverId);
    if (task.photo_required && !(evidence || []).some((entry) => entry.checklist_task_id === task.id))
      await supabase.from("evidence_submissions").insert({ account_id: item.account_id, work_item_id: turnoverId, checklist_task_id: task.id, uploader_id: user.id, storage_path: `development-test://${crypto.randomUUID()}`, evidence_type: "completion_photo", caption: marker });
  }
  const completionCount = (evidence || []).filter((entry) => entry.evidence_type === "completion_photo" && !entry.checklist_task_id).length;
  for (let index = completionCount; index < item.required_evidence_count; index++)
    await supabase.from("evidence_submissions").insert({ account_id: item.account_id, work_item_id: turnoverId, uploader_id: user.id, storage_path: `development-test://${crypto.randomUUID()}`, evidence_type: "completion_photo", caption: marker });
  const keyTask = (tasks || []).some((task) => task.mandatory && /key.*return/i.test(task.label || ""));
  if (keyTask && !(evidence || []).some((entry) => entry.evidence_type === "key_return"))
    await supabase.from("evidence_submissions").insert({ account_id: item.account_id, work_item_id: turnoverId, uploader_id: user.id, storage_path: `development-test://${crypto.randomUUID()}`, evidence_type: "key_return", caption: marker });
  if (item.status !== "in_progress") {
    const { error } = await supabase.rpc("transition_work_item", { target_work_item: turnoverId, next_status: "in_progress" });
    if (error) redirect(`/cleaner/turnovers/${turnoverId}?error=shortcut_failed`);
  }
  const { error } = await supabase.rpc("transition_work_item", { target_work_item: turnoverId, next_status: "evidence_submitted" });
  if (error) redirect(`/cleaner/turnovers/${turnoverId}?error=action_required`);
  revalidatePath(`/cleaner/turnovers/${turnoverId}`);
  redirect(`/cleaner/turnovers/${turnoverId}`);
}

async function insertPropertyChecklistTask(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, accountId: string, propertyId: string, label: string, sectionTitle: string, options = { responseType: "checkbox", mandatory: false, photoRequired: false, noteRequired: false, blocking: false }) {
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
    .eq("title", sectionTitle)
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
        title: sectionTitle,
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
    response_type: options.responseType,
    mandatory: options.mandatory,
    photo_required: options.photoRequired,
    note_required: options.noteRequired,
    blocking: options.blocking,
  });
}

export async function addChecklistTask(form: FormData) {
  const { supabase, accountId } = await requireBusinessUser();
  const propertyId = text(form, "propertyId");
  const label = text(form, "label");
  if (!label) return;
  await insertPropertyChecklistTask(supabase, accountId, propertyId, label, text(form, "sectionTitle") || "Custom tasks", { responseType: text(form, "responseType") || "checkbox", mandatory: form.get("mandatory") === "on", photoRequired: form.get("photoRequired") === "on", noteRequired: form.get("noteRequired") === "on", blocking: form.get("blocking") === "on" });
  revalidatePath(`/business/properties/${propertyId}`);
}

export async function addTurnoverChecklistTask(form: FormData) {
  const { supabase, accountId } = await requireBusinessUser();
  const turnoverId = text(form, "turnoverId");
  const scope = text(form, "scope");
  const label = text(form, "label");
  const sectionTitle = text(form, "sectionTitle") || "Custom tasks";
  if (!turnoverId || !label || !["clean", "future"].includes(scope)) return;
  const { data: turnover } = await supabase.from("work_items").select("id,property_id").eq("id", turnoverId).eq("account_id", accountId).maybeSingle();
  if (!turnover) return;
  if (scope === "future") {
    await insertPropertyChecklistTask(supabase, accountId, turnover.property_id, label, sectionTitle);
  } else {
    const { data: lastTask } = await supabase.from("checklist_tasks").select("position").eq("work_item_id", turnoverId).order("position", { ascending: false }).limit(1).maybeSingle();
    await supabase.from("checklist_tasks").insert({ account_id: accountId, work_item_id: turnoverId, section_title: sectionTitle, label, position: (lastTask?.position || 0) + 1, response_type: "checkbox", mandatory: false, photo_required: false, note_required: false, blocking: false });
  }
  revalidatePath(`/business/turnovers/${turnoverId}`);
  redirect(`/business/turnovers/${turnoverId}?taskAdded=1&scope=${scope}`);
}

export async function deleteChecklistTask(form: FormData) {
  const { supabase, accountId } = await requireBusinessUser();
  const propertyId = text(form, "propertyId");
  const taskId = text(form, "taskId");
  const { data: task } = await supabase
    .from("checklist_template_tasks")
    .select(
      "id,checklist_template_sections!inner(id,checklist_templates!inner(account_id,property_id))",
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
  ) {
    await supabase.from("checklist_template_tasks").delete().eq("id", taskId);
    const remaining = await supabase
      .from("checklist_template_tasks")
      .select("id", { count: "exact", head: true })
      .eq("section_id", section?.id);
    if (!remaining.error && (remaining.count || 0) === 0 && section?.id) {
      await supabase
        .from("checklist_template_sections")
        .delete()
        .eq("id", section.id);
    }
  }
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
  const { supabase, accountId, user } = await requireBusinessUser();
  const turnoverId = text(form, "turnoverId");
  const workerId = text(form, "workerId");
  if (!turnoverId || !workerId) return;
  const { data: worker } = await supabase
    .from("workers")
    .select("id,email,display_name,invitation_status,status")
    .eq("id", workerId)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!worker || worker.status !== "active")
    redirect(`/business/turnovers/${turnoverId}?error=worker_unavailable`);
  let invitationToken: string | null = null;
  let invitationExpiresAt: string | null = null;
  if (worker.invitation_status !== "accepted") {
    if (!worker.email)
      redirect(`/business/turnovers/${turnoverId}?error=worker_email_required`);
    const now = new Date().toISOString();
    const { data: liveInvitation } = await supabase
      .from("worker_invitations")
      .select("id")
      .eq("worker_id", workerId)
      .eq("account_id", accountId)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!liveInvitation) {
      await supabase
        .from("worker_invitations")
        .update({ revoked_at: now })
        .eq("worker_id", workerId)
        .eq("account_id", accountId)
        .is("accepted_at", null)
        .is("revoked_at", null);
      invitationToken = crypto.randomBytes(32).toString("base64url");
      invitationExpiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
      const { error: invitationError } = await supabase
        .from("worker_invitations")
        .insert({
          account_id: accountId,
          worker_id: workerId,
          token_hash: crypto.createHash("sha256").update(invitationToken).digest("hex"),
          expires_at: invitationExpiresAt,
          created_by: user.id,
        });
      if (invitationError)
        redirect(`/business/turnovers/${turnoverId}?error=invitation_failed`);
      await supabase
        .from("workers")
        .update({ invitation_status: "pending", updated_at: now })
        .eq("id", workerId)
        .eq("account_id", accountId);
    }
  }
  const { error } = await supabase.rpc("assign_work_item_worker", {
    target_work_item: turnoverId,
    target_worker: workerId,
  });
  if (error) {
    if (invitationToken)
      await supabase
        .from("worker_invitations")
        .update({ revoked_at: new Date().toISOString() })
        .eq("worker_id", workerId)
        .eq("account_id", accountId)
        .is("accepted_at", null)
        .is("revoked_at", null);
    redirect(
      `/business/turnovers/${turnoverId}?error=${encodeURIComponent(error.message)}`,
    );
  }
  const { data: assigned } = await supabase.from("assignments").select("id").eq("work_item_id", turnoverId).eq("worker_id", workerId).eq("status", "pending").order("assigned_at", { ascending: false }).limit(1).maybeSingle();
  const { data: turnover } = await supabase.from("work_items").select("property_public_name,turnover_date,guest_checkout_at,access_start_at,window_end_at").eq("id", turnoverId).eq("account_id", accountId).maybeSingle();
  if (assigned && turnover && worker.email)
    await sendCleanerAssignmentEmail({ accountId, turnoverId, workerId, cleanerEmail: worker.email, cleanerName: worker.display_name, propertyName: turnover.property_public_name, turnoverDate: turnover.turnover_date, checkoutAt: turnover.guest_checkout_at, accessStartAt: turnover.access_start_at, deadlineAt: turnover.window_end_at });
  if (invitationToken && invitationExpiresAt) {
    const { data: account } = await supabase
      .from("business_accounts")
      .select("name")
      .eq("id", accountId)
      .maybeSingle();
    const delivery = await sendCleanerInvitationEmail({
      accountId,
      workerId,
      email: worker.email!,
      workspaceName: account?.name || "Your cleaning team",
      invitationToken,
      expiresAt: invitationExpiresAt,
    });
    if (!delivery.sent) {
      await storeManualInviteLink(workerId, invitationToken, invitationExpiresAt);
      redirect(`/business/cleaners/${workerId}?invited=1&email=failed&link=1`);
    }
  }
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
  const delivery = worker.email ? await sendCleanerInvitationEmail({ accountId, workerId, email: worker.email, workspaceName: account?.name || "Your cleaning team", invitationToken: token, expiresAt }) : { sent: false as const };
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
