import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import PropertyForm from "../../components/PropertyForm";
import PropertyWizard from "../../components/PropertyWizard";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string; error?: string }>;
}) {
  const { duplicate, error } = await searchParams;
  const { supabase, accountId } = await requireBusinessUser();
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
          ? `Turnover settings and checklist will be copied from ${source.nickname}. Add the new address details.`
          : "Build the property standard in five focused steps."}
      </p>
      {source ? (
        <PropertyForm
          property={defaults}
          onboarding={false}
          duplicatePropertyId={source.id}
        />
      ) : (
        <PropertyWizard error={error} />
      )}
    </div>
  );
}
