import { requireAdmin } from "@/lib/admin/auth";
import { createProvider, updateProvider } from "@/app/admin/actions";
export default async function Page() {
  const { supabase } = await requireAdmin(),
    { data } = await supabase
      .from("service_providers")
      .select("id,name,email,phone,status,service_area,internal_notes")
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
              <details
                key={p.id}
                className="border-b p-4 last:border-0"
              >
                <summary className="flex cursor-pointer justify-between gap-4"><div>
                  <p className="font-black">{p.name}</p>
                  <p className="text-sm text-[#657089]">
                    {p.phone || p.email || "No contact details"} · {p.service_area.join(", ")}
                  </p>
                </div>
                <span className="text-sm font-bold">{p.status}</span>
                </summary>
                <form action={updateProvider} className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                  <input type="hidden" name="providerId" value={p.id}/>
                  <input name="name" defaultValue={p.name} required className={c}/><input name="phone" defaultValue={p.phone||""} className={c}/>
                  <input name="email" type="email" defaultValue={p.email||""} className={c}/><input name="serviceArea" defaultValue={p.service_area.join(", ")} required className={c}/>
                  <textarea name="internalNotes" defaultValue={p.internal_notes||""} placeholder="Internal notes" className="rounded-xl border p-3"/>
                  <select name="status" defaultValue={p.status} className={c}><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></select>
                  <button className="min-h-11 rounded-xl bg-[#071638] font-black text-white sm:col-span-2">Save provider</button>
                </form>
              </details>
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
          <label className="font-bold">Service areas<input name="serviceArea" defaultValue="SL1, SL2, SL3" required className={`mt-2 w-full ${c}`} /></label>
          <label className="font-bold">Internal notes<textarea name="internalNotes" rows={3} className="mt-2 w-full rounded-xl border p-3" /></label>
          <button className="min-h-11 rounded-xl bg-[#079448] font-black text-white">
            Add provider
          </button>
        </form>
      </div>
    </div>
  );
}
