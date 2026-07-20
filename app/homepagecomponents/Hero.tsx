"use client";

import Image from "next/image";
import CleaningBookingForm from "./CleaningBookingForm";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#061a3d] pt-[64px] lg:pt-[84px]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/quickola_hero_bg_navy.png')] bg-cover bg-center opacity-80" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,26,61,.98)_0%,rgba(6,26,61,.85)_48%,rgba(6,26,61,.25)_100%)]" />
        <div className="relative mx-auto max-w-[1180px] px-5 pb-24 pt-5 sm:px-8 sm:pb-40 sm:pt-12 lg:px-10 lg:pb-48 lg:pt-20">
          <div className="relative z-10 max-w-[680px]">
            <h1 className="mt-0 max-w-[330px] text-[39px] font-black leading-[.96] tracking-[-.055em] text-white sm:max-w-none sm:text-[64px] lg:text-[72px]">
              Professional cleaning, <span className="text-[#4bd35f]">booked in minutes.</span>
            </h1>
            <p className="mt-5 max-w-[570px] text-[17px] font-semibold leading-[1.55] text-white/80 sm:text-[19px]">
              Reliable domestic, Airbnb and commercial cleaning across Slough. Get your price, choose a time and book online.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#booking" className="inline-flex h-13 items-center justify-center rounded-xl bg-[#4bd35f] px-7 text-[15px] font-black text-[#061a3d] shadow-[0_14px_30px_rgba(75,211,95,.2)] transition hover:-translate-y-0.5 hover:bg-[#5ce46e]">
                Get instant price <span className="ml-2">→</span>
              </a>
              <a href="/commercial-cleaning" className="inline-flex h-13 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-7 text-[15px] font-black text-white backdrop-blur-sm transition hover:bg-white/15">
                Commercial contracts
              </a>
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-5 right-[-65px] w-[205px] sm:-bottom-8 sm:right-[-40px] sm:w-[390px] lg:-bottom-14 lg:right-[-10px] lg:w-[460px]">
            <Image src="/quickola_koala_cutout.png" alt="The Quickola koala" width={650} height={760} priority className="h-auto w-full drop-shadow-[0_24px_45px_rgba(0,0,0,.3)]" />
          </div>
        </div>
      </div>

      <div id="booking" className="relative z-20 mx-auto -mt-20 max-w-[1180px] px-4 pb-12 sm:-mt-24 sm:px-8 lg:-mt-28 lg:px-10">
        <CleaningBookingForm />
      </div>
    </section>
  );
}
