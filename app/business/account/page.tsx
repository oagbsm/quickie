import { requireBusinessUser } from "@/lib/business/auth";
export default async function Page() {
  const { supabase, user, accountId } = await requireBusinessUser();
  const [{ data: account }, { data: member }] = await Promise.all([
    supabase
      .from("business_accounts")
      .select("name,customer_type,status,phone,payment_mode")
      .eq("id", accountId)
      .single(),
    supabase
      .from("business_members")
      .select("full_name,role")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .single(),
  ]);
  return (
    <div className="max-w-4xl">
      <p className="text-sm font-black uppercase tracking-[.12em] text-[#079448]">
        Account settings
      </p>
      <h1 className="mt-2 text-3xl font-black">Business account</h1>
      <p className="mt-2 text-[#657089]">
        Your organisation, primary contact and account readiness.
      </p>
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Panel title="Business details">
          <Details
            rows={[
              ["Business", account?.name],
              [
                "Organisation type",
                account?.customer_type?.replaceAll("_", " "),
              ],
              ["Account status", account?.status],
            ]}
          />
        </Panel>
        <Panel title="Primary contact">
          <Details
            rows={[
              ["Name", member?.full_name],
              ["Email", user.email],
              ["Phone", account?.phone],
              ["Access level", member?.role],
            ]}
          />
        </Panel>
        <Panel title="Billing and payment">
          <p className="font-black">
            {account?.payment_mode
              ? account.payment_mode.replaceAll("_", " ")
              : "Payment setup incomplete"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#657089]">
            Quickola will confirm the applicable payment or invoicing
            arrangement before a service is fulfilled. No card details are
            collected on this page.
          </p>
        </Panel>
        <Panel title="Password and security">
          <p className="font-black">Supabase-secured account</p>
          <p className="mt-2 text-sm leading-6 text-[#657089]">
            Use the password-reset link on the sign-in page if you need to
            change your password. Contact Quickola if the organisation or
            primary contact details need updating.
          </p>
        </Panel>
      </div>
    </div>
  );
}
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Details({ rows }: { rows: (string | undefined | null)[][] }) {
  return (
    <dl className="grid gap-4">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-bold uppercase tracking-wide text-[#788398]">
            {k}
          </dt>
          <dd className="mt-1 font-black capitalize">{v || "Not provided"}</dd>
        </div>
      ))}
    </dl>
  );
}
