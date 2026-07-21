import { requireAdmin } from "@/lib/admin/auth";
import {
  PILOT_PRICING_VERSION,
  pilotPricingConfig,
  formatMoney,
} from "@/lib/business/pricing";
export default async function Page() {
  const { user, role } = await requireAdmin();
  return (
    <div>
      <h1 className="text-3xl font-black">Settings</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-black">Admin access</h2>
          <dl className="mt-4 grid gap-3">
            <div>
              <dt className="text-sm font-bold text-[#657089]">Signed in as</dt>
              <dd className="font-black">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-[#657089]">Role</dt>
              <dd className="font-black">{role}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-black">Pilot pricing</h2>
          <p className="mt-2 text-sm text-[#657089]">
            Version {PILOT_PRICING_VERSION}. Values are controlled in one typed
            server-validated configuration.
          </p>
          <dl className="mt-4 grid gap-3">
            <div>
              <dt className="text-sm font-bold text-[#657089]">Hourly rate</dt>
              <dd className="font-black">
                {formatMoney(pilotPricingConfig.hourlyRatePence)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-[#657089]">
                Minimum booking
              </dt>
              <dd className="font-black">
                {pilotPricingConfig.minimumMinutes / 60} hours
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
