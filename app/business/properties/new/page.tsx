import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import PropertyForm from "../../components/PropertyForm";
import PropertyWizard from "../../components/PropertyWizard";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    duplicate?: string;
    error?: string;
    existing?: string;
    first?: string;
  }>;
}) {
  const { duplicate, error, first } = await searchParams;
  const { supabase, accountId } = await requireBusinessUser();
  const {
    count: propertyCount,
    error: propertyCountError,
  } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("account_id", accountId);
  if (propertyCountError)
    throw new Error(`property_count_query_failed:${propertyCountError.code}`);
  if (first === "1" && (propertyCount ?? 0) > 0)
    redirect("/business/properties");
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
          ? `The checklist will be copied from ${source.nickname}. Add the new address details.`
          : "Set up your property in two focused steps."}
      </p>
      {source ? (
        <PropertyForm
          property={defaults}
          onboarding={false}
          duplicatePropertyId={source.id}
        />
      ) : (propertyCount ?? 0) === 0 ? (
        <PropertyWizard error={error} addressLookupEnabled={Boolean(process.env.GETADDRESS_API_KEY)} />
      ) : (
        <PropertyForm onboarding={false} />
      )}
    </div>
  );
}
