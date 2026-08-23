import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Provider terms | Quickola" };

export default function ProviderTermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-[#061b3f] sm:px-8">
      <article className="mx-auto max-w-3xl rounded-3xl border border-[#e7ebef] bg-white p-6 sm:p-10">
        <Link href="/work/onboarding" className="text-sm font-black text-[#167d3c]">← Back to provider setup</Link>
        <p className="mt-8 text-xs font-black uppercase tracking-[.15em] text-[#159548]">QUICKOLA PROVIDER TERMS</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">Provider terms</h1>
        <p className="mt-3 leading-7 text-[#657089]">These terms explain the standards that apply when you offer services through Quickola.</p>
        <div className="mt-8 space-y-7 leading-7 text-[#39465b]">
          <section><h2 className="text-xl font-black text-[#061b3f]">1. Your role</h2><p className="mt-2">You are an independent provider, not a Quickola employee. You are responsible for the services you agree to deliver and for complying with the laws that apply to your work.</p></section>
          <section><h2 className="text-xl font-black text-[#061b3f]">2. Accurate profile and suitable work</h2><p className="mt-2">Keep your identity, experience, services, service areas, availability and profile information accurate. Only accept work you are competent and properly qualified to perform. Keep any required licences, certificates and insurance current.</p></section>
          <section><h2 className="text-xl font-black text-[#061b3f]">3. Customers and communications</h2><p className="mt-2">Communicate professionally, arrive when agreed, treat customers and their property with care, and use Quickola communications appropriately. Do not harass, discriminate against, threaten or mislead anyone.</p></section>
          <section><h2 className="text-xl font-black text-[#061b3f]">4. Payments and payouts</h2><p className="mt-2">Customer payments and provider payouts are processed through the payment arrangements shown in Quickola. You must complete the required Stripe verification and keep your payout details up to date. Quickola fees and any applicable charges will be shown or agreed through the platform.</p></section>
          <section><h2 className="text-xl font-black text-[#061b3f]">5. Cancellations and disputes</h2><p className="mt-2">Honour accepted bookings or communicate promptly if a problem arises. Cancellations, refunds and disputes may be reviewed using the job, booking and message records and handled under Quickola’s customer and payment processes.</p></section>
          <section><h2 className="text-xl font-black text-[#061b3f]">6. Prohibited conduct</h2><p className="mt-2">Do not submit false information, misuse customer data, move customers off-platform to avoid agreed fees, manipulate reviews, create duplicate accounts, or use Quickola for unlawful or unsafe activity.</p></section>
          <section><h2 className="text-xl font-black text-[#061b3f]">7. Review and account action</h2><p className="mt-2">Quickola may review provider profiles and activity, request further information, suspend access or remove a provider who does not meet these standards or creates risk for customers or the platform.</p></section>
          <section><h2 className="text-xl font-black text-[#061b3f]">8. Privacy and updates</h2><p className="mt-2">Use customer information only to provide the agreed service and protect it appropriately. We may update these terms as the marketplace develops and will communicate material changes through the platform.</p></section>
        </div>
      </article>
    </main>
  );
}
