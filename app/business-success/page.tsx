import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "../components/Footer";
function Logo() {
  return (
    <Link href="/" className="flex items-center justify-center gap-3" aria-label="Quickola home">
      <Image
        src="/quickola/logo-mark.png"
        alt="Quickola"
        width={42}
        height={42}
        className="h-[42px] w-[42px] rounded-full object-contain"
      />
      <span className="text-[32px] font-extrabold leading-none tracking-[-0.018em] text-[#071638]">Quickola</span>
    </Link>
  );
}

function CheckIcon() {
  return (
    <span className="mx-auto grid h-[92px] w-[92px] place-items-center rounded-full bg-[#08783f] shadow-[0_24px_55px_rgba(0,104,47,0.26)] ring-[13px] ring-[#e8f7ed]">
      <svg viewBox="0 0 24 24" className="h-[50px] w-[50px] fill-none stroke-white stroke-[2.8]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6.5 12.4 3.5 3.5 7.8-8.3" />
      </svg>
    </span>
  );
}

function StepCard({ number, title, text }: { number: string; title: string; text: ReactNode }) {
  return (
    <div className="rounded-[20px] border border-[#e1e6ee] bg-white p-5 text-left shadow-[0_14px_34px_rgba(7,22,56,0.05)]">
      <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#08783f] text-[15px] font-extrabold text-white">{number}</span>
      <h2 className="mt-5 text-[18px] font-extrabold text-[#071638]">{title}</h2>
      <p className="mt-2 text-[14px] font-semibold leading-[1.5] text-[#44506a]">{text}</p>
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#fbfcfd] px-5 py-8 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif] sm:px-8 lg:px-[50px]">
      <div className="mx-auto max-w-[980px]">
        <Logo />

        <section className="relative mt-8 overflow-hidden rounded-[30px] border border-[#dcebe1] bg-white px-5 py-10 text-center shadow-[0_26px_80px_rgba(7,22,56,0.1)] sm:px-8 sm:py-12 lg:px-12">
          <div className="absolute -right-[90px] -top-[110px] h-[240px] w-[240px] rounded-full bg-[#e8f7ed]" />
          <div className="absolute -bottom-[130px] -left-[120px] h-[260px] w-[260px] rounded-full bg-[#edf3ff]" />

          <div className="relative z-10">
            <CheckIcon />

            <p className="mx-auto mt-9 inline-flex items-center rounded-full bg-[#f0faf3] px-4 py-2 text-[13px] font-extrabold uppercase tracking-[0.055em] text-[#08783f] ring-1 ring-[#d8eddd]">
              Business profile received
            </p>

            <h1 className="mx-auto mt-5 max-w-[760px] text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#071638] sm:text-[56px] lg:text-[64px]">
              Your Quickola business profile is in.
            </h1>

            <p className="mx-auto mt-5 max-w-[640px] text-[17px] font-semibold leading-[1.55] text-[#44506a] sm:text-[19px]">
              We’ll review the details and prepare your profile for local customer requests. No paid ranking, no monthly fee and no long contract.
            </p>

            <div className="mx-auto mt-8 grid max-w-[820px] gap-4 md:grid-cols-3">
              <StepCard number="1" title="We check your details" text="We make sure the business name, service, areas and contact details are clear." />
              <StepCard number="2" title="Your profile is prepared" text="Your profile can show your service, area, starting price and availability." />
              <StepCard number="3" title="Requests can be matched" text="Relevant local customer requests can be sent to you when the fit is right." />
            </div>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/for-businesses"
                className="inline-flex h-[54px] items-center justify-center rounded-[13px] border border-[#cfd6e2] bg-white px-7 text-[16px] font-extrabold text-[#071638] shadow-[0_10px_22px_rgba(7,22,56,0.04)] transition hover:-translate-y-0.5"
              >
                Add another business
              </Link>
              <Link
                href="/"
                className="inline-flex h-[54px] items-center justify-center gap-4 rounded-[13px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-7 text-[16px] font-extrabold text-white shadow-[0_16px_34px_rgba(0,104,47,0.22)] transition hover:-translate-y-0.5"
              >
                Back to Quickola
                <span className="text-[26px] leading-none">→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
      <div className="-mx-5 mt-10 sm:-mx-8 lg:-mx-[50px]">
        <Footer />
      </div>
    </main>
  );
}
