"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function createRequest(formData: FormData) {
  const service = clean(formData.get("service")) || "cleaner";
  const area = clean(formData.get("area")) || "ilford";
  const details = clean(formData.get("details"));
  const phone = clean(formData.get("phone"));
  const email = clean(formData.get("email"));
  const timeNeeded = clean(formData.get("time_needed")) || "today";

  const requestPayload = {
    service,
    area,
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
  redirect(
    `/results?service=${encodeURIComponent(service)}&area=${encodeURIComponent(area)}&phone=${encodeURIComponent(phone)}&saved=true`
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

  const { error } = await supabase.from("businesses").insert({
    business_name: businessName,
    category,
    whatsapp,
    starting_price: startingPrice ? Number(startingPrice) : null,
    areas,
    availability,
    profile_slug: profileSlug,
    description,
    status: "new",
    source: "website",
  });

  if (error) {
    console.error("Failed to create business:", error);
    throw new Error(`Could not save business: ${error.message}`);
  }

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

  const { error } = await supabase.from("businesses").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete business:", error);
    throw new Error(`Could not delete business: ${error.message}`);
  }

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
  const details = clean(formData.get("details"));
  const phone = clean(formData.get("phone"));
  const timeNeeded = clean(formData.get("time_needed")) || "today";

  if (!service || !area) {
    throw new Error("Service and area are required.");
  }

  const { error } = await supabase.from("requests").insert({
    service,
    area,
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

  revalidatePath("/qk-ops-7f3a");
}
