

function StepIcon({ type }: { type: string }) {
  if (type === "price") {
    return (
      <svg
        viewBox="0 0 64 64"
        className="h-[42px] w-[42px] fill-none stroke-[#071638] stroke-[4]"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 19h28M18 32h22M18 45h17" />
        <path d="M45 36c5 0 8 3 8 7s-3 7-8 7h-8V36h8Z" fill="#f0faf3" />
        <path d="M39 30v26" />
      </svg>
    );
  }

  if (type === "match") {
    return (
      <svg
        viewBox="0 0 64 64"
        className="h-[42px] w-[42px] fill-none stroke-[#071638] stroke-[3.6]"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 18h34M15 32h34M15 46h34" />
        <path d="M23 18a5 5 0 1 0 0 .1M41 32a5 5 0 1 0 0 .1M29 46a5 5 0 1 0 0 .1" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className="h-[42px] w-[42px] fill-none stroke-[#071638] stroke-[3.6]"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 17h32v30H16V17Z" fill="#fff" />
      <path d="m21 31 7 7 15-17" />
      <path d="M13 51h38" />
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
    <div className="relative rounded-[22px] border border-[#dfe8ef] bg-white p-5 text-left shadow-[0_12px_30px_rgba(7,22,56,0.045)] md:text-center">
      <div className="flex items-start gap-4 md:block">
        <div className="relative shrink-0 md:mx-auto">
          <span className="absolute -right-2 -top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-[#08783f] text-[14px] font-black text-white shadow-[0_8px_18px_rgba(8,120,63,0.22)]">
            {number}
          </span>
          <div className="grid h-[70px] w-[70px] place-items-center rounded-[22px] bg-[#f0faf3] ring-1 ring-[#d8eddd]">
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
            text="Pick what you need and enter your London area."
            icon="form"
          />
          <HowStep
            number="2"
            title="See the fair range"
            text="Quickola shows what the job should usually cost."
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