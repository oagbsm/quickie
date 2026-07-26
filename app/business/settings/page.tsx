import Link from "next/link";
import PendingButton from "@/app/components/PendingButton";
import { requireBusinessUser } from "@/lib/business/auth";
import { signOut } from "../actions";
import { updateWorkspaceSettings } from "../str-actions";
const field =
  "mt-1.5 min-h-12 w-full rounded-lg border border-[#cfd7e3] bg-white px-3.5 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";
export default async function Page() {
  const { supabase, accountId, user } = await requireBusinessUser();
  const [{ data: account }, { data: member }] = await Promise.all([
    supabase
      .from("business_accounts")
      .select(
        "name,timezone,default_checkout_time,default_checkin_time,default_turnover_minutes",
      )
      .eq("id", accountId)
      .maybeSingle(),
    supabase
      .from("business_members")
      .select("full_name")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-extrabold text-[#2d67b2]">SETTINGS</p>
      <h1 className="mt-1 text-3xl font-extrabold">Account and defaults</h1>
      <p className="mt-2 text-[#59677d]">
        Manage the controls that affect your Quickola workspace.
      </p>
      <form action={updateWorkspaceSettings} className="mt-7 grid gap-6">
        <section className="rounded-xl bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-extrabold">Profile</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="font-bold">
              Your name
              <input
                name="fullName"
                defaultValue={member?.full_name || ""}
                required
                minLength={2}
                className={field}
              />
            </label>
            <div>
              <p className="font-bold">Email</p>
              <p className="mt-3">{user.email}</p>
              <Link
                href="/business/update-password"
                className="mt-2 inline-block text-sm font-bold text-[#245b9d]"
              >
                Change password
              </Link>
            </div>
          </div>
        </section>
        <section className="rounded-xl bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-extrabold">Workspace</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="font-bold">
              Workspace display name
              <input
                name="workspaceName"
                defaultValue={account?.name || "My properties"}
                required
                minLength={2}
                className={field}
              />
            </label>
            <label className="font-bold">
              Timezone
              <select
                name="timezone"
                defaultValue={account?.timezone || "Europe/London"}
                className={field}
              >
                <option value="Europe/London">United Kingdom · London</option>
              </select>
            </label>
          </div>
        </section>
        <section className="rounded-xl bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-extrabold">Property defaults</h2>
              <p className="mt-1 text-sm text-[#657089]">
                Used as the starting point for new property standards.
              </p>
            </div>
            <Link
              href="/business/properties"
              className="text-sm font-bold text-[#245b9d]"
            >
              Open checklist manager
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="font-bold">
              Default checkout
              <input
                name="defaultCheckoutTime"
                type="time"
                defaultValue={account?.default_checkout_time || "11:00"}
                className={field}
              />
            </label>
            <label className="font-bold">
              Default check-in
              <input
                name="defaultCheckinTime"
                type="time"
                defaultValue={account?.default_checkin_time || "15:00"}
                className={field}
              />
            </label>
            <label className="font-bold">
              Estimated minutes
              <input
                name="defaultTurnoverMinutes"
                type="number"
                min="15"
                step="15"
                defaultValue={account?.default_turnover_minutes || 180}
                className={field}
              />
            </label>
          </div>
        </section>
        <div className="flex justify-end">
          <PendingButton
            idle="Save settings"
            pending="Saving…"
            className="min-h-12 rounded-lg bg-[#071f49] px-6 font-extrabold text-white"
          />
        </div>
      </form>
      <section className="mt-8 border-t pt-6">
        <h2 className="text-lg font-extrabold">Account</h2>
        <form action={signOut}>
          <button className="mt-3 min-h-11 rounded-lg border px-4 font-bold">
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
