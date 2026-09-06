import Link from "next/link";
import { getMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMarketplaceUnreadMessageCount } from "@/lib/marketplace/message-read-state";
import ProviderHeaderNavigation from "./ProviderHeaderNavigation";

export default async function ProviderHeader() {
  const provider = await getMarketplaceProvider();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const unreadCount = user ? await getMarketplaceUnreadMessageCount(user.id, "provider") : 0;
  const workspaceAccess = provider?.providerStatus === "approved" && provider.stripeStatus === "ready" && provider.profile.marketplace_active !== false;
  return <header className="border-b border-[#e7ebef] bg-white"><div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8"><Link href="/work" className="text-xl font-black tracking-[-.03em] text-[#061b3f]">Quickola</Link><ProviderHeaderNavigation pending={!workspaceAccess} unreadCount={unreadCount} /></div></header>;
}
