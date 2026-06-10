function StepIcon({ type }: { type: string }) {
  const navy = "#071638";
  const green = "#08783f";

  if (type === "form") {
    return (
      <svg viewBox="0 0 56 56" className="h-[38px] w-[38px]" aria-hidden="true">
        <rect x="13" y="11" width="30" height="34" rx="5" fill={navy} />
        <rect x="18" y="17" width="20" height="4" rx="2" fill="white" opacity="0.92" />
        <rect x="18" y="25" width="14" height="3.5" rx="1.75" fill="white" opacity="0.55" />
        <rect x="18" y="32" width="18" height="3.5" rx="1.75" fill="white" opacity="0.55" />
        <circle cx="39" cy="39" r="8" fill={green} />
        <path d="m35.4 39.2 2.4 2.4 5-5.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "price") {
    return (
      <svg viewBox="0 0 56 56" className="h-[38px] w-[38px]" aria-hidden="true">
        <circle cx="28" cy="28" r="19" fill={navy} />
        <path d="M32.5 18.5h-8a5.5 5.5 0 0 0 0 11h6.5a5.2 5.2 0 0 1 0 10.4h-9" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M28 14v28" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <circle cx="40" cy="38" r="8" fill={green} />
        <path d="m36.6 38.2 2.4 2.4 4.8-5.4" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 56 56" className="h-[38px] w-[38px]" aria-hidden="true">
      <circle cx="20" cy="22" r="8" fill={navy} />
      <path d="M8 43c1.6-8 6-12 12-12s10.4 4 12 12" fill={navy} />
      <circle cx="38" cy="18" r="6.5" fill={green} />
      <path d="M28.5 40c1.4-6.4 4.8-9.7 9.5-9.7 4.8 0 8.3 3.3 9.7 9.7" fill={green} />
      <path d="M31 25.5 24 32" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

function HowStep({
  number,
  title,
  text,
  icon,
}: {
  number: string;
  title: string;
  text: string;
  icon: string;
}) {
  return (
    <div className="relative rounded-[22px] border border-[#dfe8ef] bg-white p-5 text-left shadow-[0_10px_24px_rgba(7,22,56,0.035)] md:text-center">
      <div className="flex items-start gap-4 md:block">
        <div className="relative shrink-0 md:mx-auto">
          <span className="absolute -right-2 -top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-[#08783f] text-[14px] font-black text-white shadow-[0_6px_14px_rgba(8,120,63,0.18)]">
            {number}
          </span>
          <div className="grid h-[70px] w-[70px] place-items-center rounded-[22px] bg-[#f2f8f4] ring-1 ring-[#dceee2]">
            <StepIcon type={icon} />
          </div>
        </div>

        <div className="min-w-0 md:mt-4">
          <h3 className="text-[19px] font-black leading-[1.08] tracking-[-0.035em] text-[#071638] md:text-[20px]">
            {title}
          </h3>
          <p className="mt-2 text-[14px] font-semibold leading-[1.5] text-[#556177] md:mx-auto md:max-w-[230px]">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how" className="bg-[#f7f9fb] px-5 py-12 sm:px-8 lg:px-[60px] lg:py-14">
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-[680px] text-center">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#08783f]">
            How it works
          </p>
          <h2 className="mt-3 text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#071638] sm:text-[44px]">
            Check the price first. Book only if it makes sense.
          </h2>
        </div>

        <div className="mx-auto mt-8 grid max-w-[980px] gap-4 md:grid-cols-3">
          <HowStep
            number="1"
            title="Choose a service"
            text="Pick what you need and enter your Slough area."
            icon="form"
          />
          <HowStep
            number="2"
            title="See the usual range"
            text="Quickola shows a guide based on local jobs."
            icon="price"
          />
          <HowStep
            number="3"
            title="Request a match"
            text="Continue only if you want help finding a local provider."
            icon="match"
          />
        </div>
      </div>
    </section>
  );
}