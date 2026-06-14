"use client";

import CumarIntakeForm, { cumarServices } from "./CumarIntakeForm";

const popularServices = cumarServices.slice(0, 6);
const popularCarouselServices = [...popularServices, ...popularServices];

function PopularServiceIcon({ service }: { service: string }) {
  const navy = "#071638";
  const green = "#07833f";

  if (service === "man-and-van") {
    return (
      <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
        <rect x="8" y="13" width="16" height="11" rx="1.8" fill={navy} />
        <path d="M24 17h5.2l4.8 5.2V24H24z" fill={navy} />
        <rect x="11" y="10" width="10" height="4" rx="1" fill={green} />
        <rect x="13" y="11" width="6" height="2" rx="0.7" fill="white" opacity="0.9" />
        <circle cx="14" cy="27" r="3.2" fill={navy} />
        <circle cx="30" cy="27" r="3.2" fill={navy} />
        <circle cx="14" cy="27" r="1.25" fill="white" opacity="0.8" />
        <circle cx="30" cy="27" r="1.25" fill="white" opacity="0.8" />
      </svg>
    );
  }

  if (service === "cleaner") {
    return (
      <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
        <path d="M15 7h10l2.2 6H12.8z" fill={navy} />
        <rect x="12" y="12" width="16" height="22" rx="3" fill={navy} />
        <rect x="15" y="16" width="10" height="3" rx="1.5" fill="white" opacity="0.92" />
        <rect x="16" y="22" width="8" height="7" rx="1.4" fill="white" opacity="0.22" />
        <path d="M8 20h5" stroke={green} strokeWidth="3" strokeLinecap="round" />
        <path d="M6 26h7" stroke={green} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (service === "plumber") {
    return (
      <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
        <rect x="7" y="19" width="20" height="5" rx="2.5" fill={navy} />
        <rect x="22" y="9" width="5" height="15" rx="2.5" fill={navy} />
        <rect x="25" y="8" width="9" height="5" rx="2.5" fill={navy} />
        <rect x="10" y="23" width="5" height="8" rx="2.5" fill={navy} />
        <path d="M9 31h8" stroke={green} strokeWidth="3" strokeLinecap="round" />
        <path d="M30 25c0 3.8-2.7 6.8-6 6.8s-6-3-6-6.8c0-3.2 3.8-7.6 6-10 2.2 2.4 6 6.8 6 10Z" fill={green} />
        <path d="M24 20.5c1.1 1.6 2.1 3.1 2.1 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    );
  }

  if (service === "locksmith") {
    return (
      <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
        <circle cx="15" cy="25" r="7" fill={navy} />
        <circle cx="15" cy="25" r="2.6" fill="white" opacity="0.9" />
        <rect x="20" y="14" width="16" height="5" rx="2.5" transform="rotate(-45 20 14)" fill={navy} />
        <rect x="28" y="10" width="4" height="7" rx="1" transform="rotate(-45 28 10)" fill={green} />
        <rect x="31" y="7" width="3" height="6" rx="1" transform="rotate(-45 31 7)" fill={green} />
      </svg>
    );
  }

  if (service === "gardener") {
    return (
      <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
        <rect x="18" y="16" width="4" height="19" rx="2" fill={navy} />
        <path d="M20 20C11.5 20 7 15.3 7 7c8.4 0 13 4.8 13 13Z" fill={green} />
        <path d="M20 23c8 0 12.5-4.5 12.5-12.5C24.5 10.5 20 15 20 23Z" fill={navy} />
        <path d="M11 11c3.8 1.1 6.6 3.4 9 7" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    );
  }

  if (service === "handyman") {
    return (
      <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
        <path d="M9 30 26.8 12.2a5.2 5.2 0 0 0 5.6-1.2L35 8.4 31.6 5l-2.7 2.6a5.2 5.2 0 0 0-1.2 5.6L10 31a2.1 2.1 0 0 1-1-1Z" fill={navy} />
        <rect x="22" y="23" width="15" height="4" rx="2" transform="rotate(45 22 23)" fill={green} />
        <rect x="25" y="20" width="10" height="4" rx="2" transform="rotate(135 25 20)" fill={green} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
      <rect x="8" y="8" width="10" height="10" rx="2" fill={navy} />
      <rect x="22" y="8" width="10" height="10" rx="2" fill={green} />
      <rect x="8" y="22" width="10" height="10" rx="2" fill={green} />
      <rect x="22" y="22" width="10" height="10" rx="2" fill={navy} />
    </svg>
  );
}

function popularLabel(label: string) {
  if (label === "Man & Van") return "Moving";
  return label;
}

export default function Hero() {
  function selectPopularService(serviceValue: string) {
    window.location.href = `/check-price?service=${serviceValue}`;
  }

  return (
    <section className="relative isolate overflow-hidden bg-[#061a3d] pt-[64px] lg:pt-[84px]">
      <div className="relative overflow-hidden bg-[#061a3d]">
        <div
          className="absolute inset-0 z-0 bg-contain bg-center bg-no-repeat opacity-100 lg:bg-cover lg:bg-center lg:opacity-95"
          style={{ backgroundImage: "url('/quickola_hero_bg_navy.png')" }}
        />
        <div className="absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(6,26,61,0.58)_0%,rgba(6,26,61,0.38)_43%,rgba(6,26,61,0.02)_100%)] lg:bg-[linear-gradient(90deg,rgba(6,26,61,0.78)_0%,rgba(6,26,61,0.48)_43%,rgba(6,26,61,0.12)_100%)]" />

        <div className="relative z-10 mx-auto max-w-[1180px] px-4 pb-[24px] pt-4 sm:px-6 lg:px-8 lg:pb-[125px] lg:pt-8 xl:pb-[136px]">
          <div className="relative grid min-h-[292px] grid-cols-2 items-start gap-0 pt-0 sm:min-h-[500px] lg:min-h-[296px] lg:grid-cols-[minmax(0,0.86fr)_minmax(336px,0.74fr)] lg:items-center lg:gap-6 lg:pt-0 xl:min-h-[312px]">
            <div className="relative z-20 col-span-1 max-w-[210px] -translate-y-2 pb-4 pt-0 sm:max-w-[520px] lg:ml-8 lg:max-w-[448px] lg:-translate-y-1.5 lg:pb-8 lg:pt-4 xl:ml-10">

              <h1 className="mt-0 max-w-[210px] text-[39px] font-black leading-[0.91] tracking-[-0.055em] text-white sm:mt-6 sm:max-w-[520px] sm:text-[62px] lg:mt-0 lg:max-w-[448px] lg:text-[62px] xl:text-[67px]">
                What do you <span className="text-[#4bd35f]">need today?</span>
              </h1>

              <p className="mt-4 max-w-[205px] text-[15px] font-semibold leading-[1.32] tracking-[-0.025em] text-white/90 sm:mt-5 sm:max-w-[520px] sm:text-[21px] lg:mt-4 lg:max-w-[432px] lg:text-[17px]">
                Kola checks the <span className="font-black text-[#4bd35f]">usual local price</span> — and can help find someone available.
              </p>

            </div>

            <div className="pointer-events-none absolute bottom-[-21px] right-[-22px] z-10 w-[220px] opacity-100 sm:right-[-50px] sm:w-[540px] lg:bottom-[-72px] lg:right-[7%] lg:w-[306px] xl:bottom-[-82px] xl:right-[5%] xl:w-[348px]">
              <img
                src="/quickola_koala_cutout.png"
                alt="Kola the Quickola koala holding a magnifying glass"
                className="h-auto w-full select-none object-contain drop-shadow-[0_22px_44px_rgba(0,0,0,0.28)]"
                draggable="false"
              />
            </div>
          </div>
        </div>
      </div>  

      <div className="relative z-20 mx-auto -mt-[68px] max-w-[1040px] bg-[#061a3d] px-4 pb-6 sm:px-6 lg:-mt-[123px] lg:max-w-none lg:bg-[linear-gradient(to_bottom,#061a3d_0%,#061a3d_50%,#ffffff_50%,#ffffff_100%)] lg:px-5 lg:pb-8">
        <div className="mx-auto overflow-hidden rounded-[22px] bg-white p-3 shadow-[0_22px_64px_rgba(7,22,56,0.20)] ring-1 ring-[#edf2f7] sm:rounded-[26px] sm:p-6 lg:max-w-[940px] lg:p-6 xl:max-w-[980px]">
          <h2 className="text-center text-[18px] font-black tracking-[-0.045em] text-[#071638] sm:text-[22px] lg:text-[24px]">
            Check your local price
          </h2>

          <CumarIntakeForm variant="desktop" className="mt-3 sm:mt-5 lg:mt-4" />

          <div className="mt-3 grid grid-cols-3 divide-x divide-[#dde7f2] rounded-[14px] bg-[#fbfdff] px-1.5 py-2 text-center text-[10px] font-black text-[#071638] sm:mt-4 sm:rounded-[16px] sm:px-3 sm:py-3 sm:text-[14px] lg:mt-5 lg:bg-white lg:px-3 lg:py-2 lg:text-[12px]">
            <div className="flex items-center justify-center gap-2 px-2">
              <span className="text-[#079448]">✓</span> Free to check
            </div>
            <div className="flex items-center justify-center gap-2 px-2">
              <span className="text-[#079448]">🔒</span> No signup
            </div>
            <div className="flex items-center justify-center gap-2 px-2">
              <span className="text-[#079448]">🛡</span> No booking required
            </div>
          </div>
        </div>
      </div>

    
    </section>
  );
}