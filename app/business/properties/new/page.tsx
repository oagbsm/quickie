import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import PropertyForm from "../../components/PropertyForm";
import PropertyWizard from "../../components/PropertyWizard";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string; error?: string; existing?: string }>;
}) {
  const { duplicate, error } = await searchParams;
  const { supabase, accountId } = await requireBusinessUser();
  const { data: accountDefaults } = await supabase.from("business_accounts").select("default_checkout_time,default_checkin_time,default_turnover_minutes").eq("id", accountId).maybeSingle();
  const { data: source } = duplicate
    ? await supabase
        .from("properties")
        .select("*")
        .eq("id", duplicate)
        .eq("account_id", accountId)
        .maybeSingle()
    : { data: null };
  const defaults = source
    ? {
        ...source,
        id: null,
        nickname: `${source.nickname} copy`,
        address_line_1: "",
        address_line_2: "",
        postcode: "",
      }
    : undefined;
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/business/properties"
        className="text-sm font-bold text-[#59677d]"
      >
        ← Properties
      </Link>
      <h1 className="mb-2 mt-4 text-3xl font-extrabold">Add a property</h1>
      <p className="mb-7 text-[#59677d]">
        {source
          ? `Clean settings and checklist will be copied from ${source.nickname}. Add the new address details.`
          : "Set up your property in four focused steps."}
      </p>
      {source ? (
        <PropertyForm
          property={defaults}
          onboarding={false}
          duplicatePropertyId={source.id}
        />
      ) : (
        <PropertyWizard error={error} addressLookupEnabled={Boolean(process.env.GETADDRESS_API_KEY)} defaults={{ checkout: accountDefaults?.default_checkout_time || "11:00", checkin: accountDefaults?.default_checkin_time || "15:00", duration: accountDefaults?.default_turnover_minutes || 180 }} />
      )}
    </div>
  );
}
