import { requireAdmin } from "@/lib/admin/auth";
import { setAccountSuspension } from "@/app/admin/actions";
export default async function Page() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("business_accounts")
    .select(
      "id,name,created_at,suspended_at,properties(id),workers(id),work_items(id)",
    )
    .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Accounts</h1>
      <p className="mt-2 text-[#59677d]">
        Owner workspaces and operational record counts.
      </p>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#f4f6f9] text-[#59677d]">
            <tr>
              <th className="p-4">Account</th>
              <th className="p-4">Properties</th>
              <th className="p-4">Cleaners</th>
              <th className="p-4">Turnovers</th>
              <th className="p-4">Created</th>
              <th className="p-4">State</th>
              <th className="p-4">Support action</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((account) => (
              <tr key={account.id} className="border-t">
                <td className="p-4 font-extrabold">{account.name}</td>
                <td className="p-4">{account.properties.length}</td>
                <td className="p-4">{account.workers.length}</td>
                <td className="p-4">{account.work_items.length}</td>
                <td className="p-4">
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                  }).format(new Date(account.created_at))}
                </td>
                <td className="p-4">
                  <form action={setAccountSuspension} className="grid gap-2">
                    <input type="hidden" name="accountId" value={account.id} />
                    <input
                      type="hidden"
                      name="suspend"
                      value={account.suspended_at ? "0" : "1"}
                    />
                    {!account.suspended_at && (
                      <input
                        name="reason"
                        required
                        minLength={5}
                        placeholder="Suspension reason"
                        className="min-h-10 rounded-lg border px-2"
                      />
                    )}
                    <button
                      className={`min-h-10 rounded-lg border px-3 font-bold ${account.suspended_at ? "text-emerald-800" : "text-red-700"}`}
                    >
                      {account.suspended_at ? "Reactivate" : "Suspend"}
                    </button>
                  </form>
                </td>
                <td className="p-4">
                  {account.suspended_at ? (
                    <span className="font-bold text-red-700">Suspended</span>
                  ) : (
                    <span className="font-bold text-emerald-700">Active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
