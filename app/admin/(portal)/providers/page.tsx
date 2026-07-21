import { requireAdmin } from "@/lib/admin/auth";
import { createProvider } from "@/app/admin/actions";
export default async function Page() {
  const { supabase } = await requireAdmin(),
    { data } = await supabase
      .from("service_providers")
      .select("id,name,email,phone,status,service_area")
      .order("name");
  const c = "min-h-11 rounded-xl border px-3";
  return (
    <div>
      <h1 className="text-3xl font-black">Providers</h1>
      <p className="mt-1 text-[#657089]">
        Cleaners available for business bookings.
      </p>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border bg-white">
          {data?.length ? (
            data.map((p) => (
              <div
                key={p.id}
                className="flex justify-between gap-4 border-b p-4 last:border-0"
              >
                <div>
                  <p className="font-black">{p.name}</p>
                  <p className="text-sm text-[#657089]">
                    {p.phone || p.email || "No contact details"}
                  </p>
                </div>
                <span className="text-sm font-bold">{p.status}</span>
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-[#657089]">
              No providers yet. Add the first cleaner to enable assignment.
            </p>
          )}
        </div>
        <form
          action={createProvider}
          className="grid h-fit gap-3 rounded-2xl border bg-white p-5"
        >
          <h2 className="text-lg font-black">Add provider</h2>
          <label className="font-bold">
            Name
            <input name="name" required className={`mt-2 w-full ${c}`} />
          </label>
          <label className="font-bold">
            Phone
            <input name="phone" type="tel" className={`mt-2 w-full ${c}`} />
          </label>
          <label className="font-bold">
            Email
            <input name="email" type="email" className={`mt-2 w-full ${c}`} />
          </label>
          <button className="min-h-11 rounded-xl bg-[#079448] font-black text-white">
            Add provider
          </button>
        </form>
      </div>
    </div>
  );
}
