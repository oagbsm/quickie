"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
const value = (f: FormData, n: string) => String(f.get(n) || "").trim();
function refresh(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  if (id) revalidatePath(`/admin/bookings/${id}`);
}
export async function adminSignOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
export async function transitionBooking(f: FormData) {
  const { supabase } = await requireAdmin(),
    id = value(f, "bookingId"),
    status = value(f, "status"),
    { error } = await supabase.rpc("admin_transition_booking", {
      target_booking: id,
      next_status: status,
      reason: value(f, "reason") || null,
      completion_note: value(f, "completionNote") || null,
    });
  if (error)
    redirect(
      `/admin/bookings/${id}?error=${encodeURIComponent(error.message)}`,
    );
  refresh(id);
  redirect(`/admin/bookings/${id}?success=status`);
}
export async function updateBookingOperations(f: FormData) {
  const { supabase } = await requireAdmin(), id = value(f, "bookingId");
  const localToIso = (name: string) => { const raw = value(f, name); return raw ? new Date(raw).toISOString() : null; };
  const { error } = await supabase.rpc("admin_update_booking_operations", {
    target_booking: id, note_internal: value(f, "internalNotes") || null,
    note_customer: value(f, "customerUpdate") || null,
    arrival_start: localToIso("arrivalStart"), arrival_end: localToIso("arrivalEnd"),
  });
  if (error) redirect(`/admin/bookings/${id}?error=${encodeURIComponent(error.message)}`);
  refresh(id); redirect(`/admin/bookings/${id}?success=operations`);
}
export async function assignProvider(f: FormData) {
  const { supabase } = await requireAdmin(),
    id = value(f, "bookingId"),
    provider = value(f, "providerId"),
    { error } = await supabase.rpc("admin_assign_provider", {
      target_booking: id,
      target_provider: provider,
    });
  if (error)
    redirect(
      `/admin/bookings/${id}?error=${encodeURIComponent(error.message)}`,
    );
  refresh(id);
  redirect(`/admin/bookings/${id}?success=assigned`);
}
export async function unassignProvider(f: FormData) {
  const { supabase } = await requireAdmin(),
    id = value(f, "bookingId"),
    { error } = await supabase.rpc("admin_unassign_provider", {
      target_booking: id,
    });
  if (error)
    redirect(
      `/admin/bookings/${id}?error=${encodeURIComponent(error.message)}`,
    );
  refresh(id);
  redirect(`/admin/bookings/${id}?success=unassigned`);
}
export async function confirmPrice(f: FormData) {
  const { supabase } = await requireAdmin(),
    id = value(f, "bookingId"),
    pounds = Number(value(f, "price")),
    reason = value(f, "reason");
  if (!Number.isFinite(pounds) || pounds <= 0)
    redirect(`/admin/bookings/${id}?error=invalid_price`);
  const { error } = await supabase.rpc("admin_confirm_booking_price", {
    target_booking: id,
    price_pence: Math.round(pounds * 100),
    override_reason: reason || null,
  });
  if (error)
    redirect(
      `/admin/bookings/${id}?error=${encodeURIComponent(error.message)}`,
    );
  refresh(id);
  redirect(`/admin/bookings/${id}?success=price`);
}
export async function createProvider(f: FormData) {
  const { supabase } = await requireAdmin(),
    name = value(f, "name"),
    email = value(f, "email"),
    phone = value(f, "phone"),
    areas = value(f, "serviceArea").toUpperCase().split(/[,\s]+/).filter(Boolean),
    notes = value(f, "internalNotes");
  if (name.length < 2) redirect("/admin/providers?error=name");
  const { error } = await supabase.from("service_providers").insert({
    name,
    email: email || null,
    phone: phone || null,
    service_area: areas.length ? areas : ["SL1", "SL2", "SL3"],
    internal_notes: notes || null,
    status: "active",
  });
  if (error)
    redirect(`/admin/providers?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/providers");
  redirect("/admin/providers?success=created");
}
export async function updateProvider(f: FormData) {
  const { supabase } = await requireAdmin(), id = value(f, "providerId"), status = value(f, "status"), name = value(f, "name"),
    areas = value(f, "serviceArea").toUpperCase().split(/[,\s]+/).filter(Boolean);
  if (!id || name.length < 2 || !["active", "paused", "archived"].includes(status) || !areas.length) redirect("/admin/providers?error=invalid_provider");
  const { error } = await supabase.from("service_providers").update({ name, email: value(f, "email") || null, phone: value(f, "phone") || null, status, service_area: areas, internal_notes: value(f, "internalNotes") || null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(`/admin/providers?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/providers"); redirect("/admin/providers?success=updated");
}
export async function inviteBusiness(f: FormData) {
  const { supabase, user } = await requireAdmin();
  const enquiryId = value(f, "enquiryId"),
    email = value(f, "email").toLowerCase(),
    businessName = value(f, "businessName"),
    fullName = value(f, "fullName"),
    phone = value(f, "phone"),
    customerType = value(f, "customerType");
  if (
    !/^\S+@\S+\.\S+$/.test(email) ||
    businessName.length < 2 ||
    fullName.length < 2 ||
    ![
      "landlord",
      "airbnb_operator",
      "letting_agent",
      "property_manager",
      "office_business",
      "block_manager",
      "other",
    ].includes(customerType)
  )
    redirect("/admin/enquiries?error=invalid_invitation");
  const site = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.quickola.co.uk"
  ).replace(/\/$/, "");
  const { error } =
    await createSupabaseAdminClient().auth.admin.inviteUserByEmail(email, {
      redirectTo: `${site}/auth/callback?next=/business/continue`,
      data: {
        account_kind: "quickola_business",
        business_name: businessName,
        full_name: fullName,
        phone,
        customer_type: customerType,
      },
    });
  if (error) {
    console.error("business_invitation_failed", {
      code: error.code,
      adminUserId: user.id,
    });
    redirect("/admin/enquiries?error=invitation_failed");
  }
  if (enquiryId)
    await supabase
      .from("business_enquiries")
      .update({
        status: "invited",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", enquiryId);
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/customers");
  redirect("/admin/enquiries?success=invited");
}
