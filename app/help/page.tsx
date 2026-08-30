import type { Metadata } from "next";
import Link from "next/link";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";

export const metadata: Metadata = { title: "Quickola help", description: "Get help with your Quickola account, booking or professional profile." };
const options = [["Customer help", "Questions about a submitted job or booking.", "/contact"], ["Professional help", "Questions about joining or using Quickola as a professional.", "/for-providers"], ["Account help", "Sign in to Quickola or get help with access.", "/sign-in"], ["Contact support", "Send the Quickola team a message.", "/contact"]];

export default function HelpPage() { return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><section className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16"><p className="text-xs font-black uppercase tracking-[.16em] text-[#159548]">Help</p><h1 className="mt-3 text-5xl font-black tracking-[-.07em]">How can we help?</h1><div className="mt-8 grid gap-3 sm:grid-cols-2">{options.map(([title, body, href]) => <Link key={title} href={href} className="rounded-2xl bg-white p-5 ring-1 ring-[#e9edf1] transition hover:-translate-y-0.5"><h2 className="text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-[#526078]">{body}</p><span className="mt-4 block text-sm font-black text-[#167d3c]">Get help →</span></Link>)}</div></section></main>; }
