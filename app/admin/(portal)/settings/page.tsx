import { requireAdmin } from "@/lib/admin/auth";

export default async function SettingsPage() {
  const { user, role } = await requireAdmin();
  return <div className="max-w-2xl"><h1 className="text-3xl font-black">Settings</h1><p className="mt-1 text-[#657089]">Marketplace admin access and configuration.</p><section className="mt-6 rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">Admin access</h2><dl className="mt-5 grid gap-4"><div><dt className="text-sm font-bold text-[#657089]">Signed in as</dt><dd className="font-black">{user.email}</dd></div><div><dt className="text-sm font-bold text-[#657089]">Role</dt><dd className="font-black capitalize">{role}</dd></div><div><dt className="text-sm font-bold text-[#657089]">Access model</dt><dd className="font-black">Supabase Auth + active admin record</dd></div></dl></section></div>;
}
