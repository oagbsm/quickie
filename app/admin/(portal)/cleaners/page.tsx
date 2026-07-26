import { requireAdmin } from "@/lib/admin/auth";
import { adminRevokeWorkerInvitation } from "@/app/admin/actions";
export default async function Page() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("workers")
    .select(
      "id,account_id,display_name,company_name,email,mobile,status,invitation_status,created_at,business_accounts(name)",
    )
    .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Cleaner invitations</h1>
      <p className="mt-2 text-[#59677d]">
        Account-owned cleaner contacts and invitation state. Quickola does not
        approve or dispatch these workers.
      </p>
      <div className="mt-6 divide-y overflow-hidden rounded-xl border bg-white">
        {data?.length ? (
          data.map((worker) => {
            const account = Array.isArray(worker.business_accounts)
              ? worker.business_accounts[0]
              : worker.business_accounts;
            return (
              <article
                key={worker.id}
                className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_140px_120px] sm:items-center"
              >
                <div>
                  <p className="font-extrabold">{worker.display_name}</p>
                  <p className="text-sm text-[#59677d]">
                    {worker.company_name || "Independent cleaner"} ·{" "}
                    {account?.name}
                  </p>
                </div>
                <p className="text-sm">{worker.email || worker.mobile}</p>
                <span className="text-sm font-bold capitalize">
                  {worker.invitation_status.replaceAll("_", " ")}
                </span>
                {worker.invitation_status === "pending" ? (
                  <form action={adminRevokeWorkerInvitation}>
                    <input
                      type="hidden"
                      name="accountId"
                      value={worker.account_id}
                    />
                    <button
                      name="workerId"
                      value={worker.id}
                      className="min-h-10 rounded-lg border px-3 text-sm font-bold text-red-700"
                    >
                      Revoke
                    </button>
                  </form>
                ) : (
                  <span />
                )}
              </article>
            );
          })
        ) : (
          <p className="p-8 text-center text-[#59677d]">
            No cleaner contacts yet.
          </p>
        )}
      </div>
    </div>
  );
}
