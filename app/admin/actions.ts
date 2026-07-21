"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
    });
  if (error)
    redirect(
      `/admin/bookings/${id}?error=${encodeURIComponent(error.message)}`,
    );
  refresh(id);
  redirect(`/admin/bookings/${id}?success=status`);
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
    phone = value(f, "phone");
  if (name.length < 2) redirect("/admin/providers?error=name");
  const { error } = await supabase
    .from("service_providers")
    .insert({
      name,
      email: email || null,
      phone: phone || null,
      status: "active",
    });
  if (error)
    redirect(`/admin/providers?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/providers");
  redirect("/admin/providers?success=created");
}
