import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import PublicHeader from "./components/PublicHeader";

export const metadata: Metadata = {
  title: "Property Cleaning Management for Landlords and Airbnb Hosts | Quickola",
  description: "Add your properties, arrange one-off or recurring cleans, track every job and receive completion updates in one place.",
};

const benefits = ["Add and manage multiple properties", "Book one-off or recurring cleans", "Track every job", "Receive completion photos", "Keep billing and service history together", "One point of contact"];
const customers = ["Landlord", "Airbnb or serviced accommodation", "Letting or managing agent", "Office or business", "Block or communal-property manager", "Other"];

export default function BusinessPage() {
  return <main className="min-h-screen bg-white text-[#071638]">
    <PublicHeader />
    <section className="bg-[#061a3d] px-5 py-18 text-white sm:px-8 sm:py-24">
      <div className="mx-auto max-w-[1120px]"><p className="text-sm font-black uppercase tracking-[.14em] text-[#4bd35f]">Manage properties</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-[-.045em] sm:text-6xl">Manage cleaning across all your properties.</h1>
        <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/75">Add your properties once, arrange one-off or recurring cleans, track every visit and keep everything in one place.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/business/sign-up" className="rounded-xl bg-[#4bd35f] px-6 py-3.5 text-center font-black text-[#061a3d]">Create business account</Link><Link href="/business/sign-in" className="rounded-xl border border-white/25 px-6 py-3.5 text-center font-black">Sign in</Link></div>
        <p className="mt-5 text-sm font-bold text-white/60">For landlords, Airbnb operators, letting agents, property managers and businesses.</p>
      </div>
    </section>
    <section className="px-5 py-16 sm:px-8"><div className="mx-auto max-w-[1120px]"><h2 className="text-3xl font-black tracking-tight">Everything you need to know the job is done</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{benefits.map(x => <div key={x} className="rounded-2xl border border-[#e1e6ee] p-5 font-extrabold"><span className="mr-3 text-[#079448]">✓</span>{x}</div>)}</div></div></section>
    <section className="bg-[#f5f7fa] px-5 py-16 sm:px-8"><div className="mx-auto max-w-[1120px]"><h2 className="text-3xl font-black">How it works</h2><div className="mt-8 grid gap-5 md:grid-cols-4">{["Create your account", "Add your properties", "Book once or set a schedule", "Get confirmation when it’s ready"].map((x,i)=><div key={x} className="rounded-2xl bg-white p-6 shadow-sm"><span className="text-sm font-black text-[#079448]">0{i+1}</span><p className="mt-4 font-black">{x}</p></div>)}</div></div></section>
    <section className="px-5 py-16 sm:px-8"><div className="mx-auto max-w-[1120px]"><h2 className="text-3xl font-black">Built for one property or a portfolio</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{customers.map(x=><div key={x} className="rounded-2xl border border-[#e1e6ee] p-6 font-black">{x}</div>)}</div></div></section>
    <section className="bg-[#061a3d] px-5 py-16 text-white sm:px-8"><div className="mx-auto max-w-[1120px]"><p className="text-sm font-black text-[#4bd35f]">PROPERTY READY</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Know the property is ready before your guest does.</h2><p className="mt-4 max-w-2xl text-white/70">See job status and completion evidence in one place. When a clean is completed, you’ll receive a clear update without chasing cleaners.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/business/sign-up" className="rounded-xl bg-[#4bd35f] px-6 py-3.5 font-black text-[#061a3d]">Add your first property</Link><Link href="/contact?subject=tailored-property-setup" className="rounded-xl border border-white/25 px-6 py-3.5 font-black">Need a tailored setup?</Link></div></div></section>
    <Footer />
  </main>;
}
