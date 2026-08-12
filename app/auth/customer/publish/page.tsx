import Link from "next/link";
import { publishPendingMarketplaceJobAndRedirect } from "@/app/post-job/actions";
export default async function Page({ searchParams }: { searchParams: Promise<{ draft?: string }> }) {
  const { draft } = await searchParams;
  if (draft) await publishPendingMarketplaceJobAndRedirect(draft);
  return <main className="mx-auto max-w-lg px-5 py-16"><div className="rounded-3xl bg-white p-7 shadow-lg"><h1 className="text-2xl font-black text-[#061b3f]">We couldn’t find that draft</h1><p className="mt-2 text-sm text-[#657089]">Start your job again and we’ll save it while you create an account.</p><Link href="/" className="mt-5 inline-block font-bold text-[#167d3c]">Back to Quickola</Link></div></main>;
}
