import type { Metadata } from "next";
import { redirect } from "next/navigation";
export const metadata:Metadata={title:"Sign in | Quickola",robots:{index:false,follow:false}};
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => { if (value) params.set(key, value); });
  redirect(`/sign-in${params.toString() ? `?${params.toString()}` : ""}`);
}
