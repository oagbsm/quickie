

function StepIcon({ type }: { type: string }) {
  if (type === "search") {
    return (
      <svg
        viewBox="0 0 64 64"
        className="h-[44px] w-[44px] fill-none stroke-[#071638] stroke-[4]"
        strokeLinecap="round"
      >
        <circle cx="28" cy="28" r="17" />
        <path d="m41 41 15 15" />
      </svg>
    );
  }

  if (type === "clipboard") {
    return (
      <svg
        viewBox="0 0 64 64"
        className="h-[44px] w-[44px] fill-none stroke-[#071638] stroke-[3.5]"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10h20l3 8h8v39H11V18h8l3-8Z" fill="#fff" />
        <path d="M23 29h18M23 40h18M18 29l2 2 4-5M18 40l2 2 4-5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className="h-[44px] w-[44px] fill-none stroke-[#071638] stroke-[3.5]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 8h32l5 6v42H14V8Z" fill="#fff" />
      <path d="M23 24h16M23 34h12M23 44h10" />
      <path d="m39 43 12-12 5 5-12 12-7 2 2-7Z" fill="#fff4b8" />
    </svg>
  );
}

function HowStep({
  number,
  color,
  title,
  text,
  icon,
}: {
  number: string;
  color: string;
  title: string;
  text: string;
  icon: string;
}) {
  const titleColor =
    number === "1"
      ? "text-[#08783f]"
      : number === "2"
        ? "text-[#5b2bbd]"
        : "text-[#0e65c7]";

  const circleBg = number === "2" ? "bg-[#f1eafe]" : "bg-[#edf7ef]";

  return (
    <div className="relative text-center before:absolute before:left-[-28%] before:top-[40px] before:hidden before:h-0 before:w-[60%] before:border-t before:border-dashed before:border-[#aeb6c6] md:before:block first:before:hidden">
      <span
        className={`absolute left-[24%] top-[2px] z-10 grid h-[30px] w-[30px] place-items-center rounded-full ${color} text-[16px] font-black text-white`}
      >
        {number}
      </span>
      <div className={`mx-auto grid h-[66px] w-[66px] place-items-center rounded-full ${circleBg}`}>
        <StepIcon type={icon} />
      </div>
      <h3 className={`mt-[13px] text-[15px] font-black leading-none tracking-[-0.03em] ${titleColor}`}>
        {title}
      </h3>
      <p className="mx-auto mt-[7px] max-w-[190px] text-[12px] font-semibold leading-[1.4] text-[#172545]">
        {text}
      </p>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how" className="px-[44px] py-[18px]">
      <h2 className="text-center text-[27px] font-black leading-none tracking-[-0.05em] text-[#071638]">
        How Quickola works
      </h2>

      <div className="mx-auto mt-[15px] grid max-w-[920px] gap-[18px] md:grid-cols-3">
        <HowStep
          number="1"
          color="bg-[#07813c]"
          title="Tell us what you need"
          text="Quick and easy. Takes less than a minute."
          icon="form"
        />
        <HowStep
          number="2"
          color="bg-[#5b2bbd]"
          title="We check local options"
          text="We compare prices, availability and reviews."
          icon="search"
        />
        <HowStep
          number="3"
          color="bg-[#0e65c7]"
          title="You get the best options"
          text="Choose what works best for you."
          icon="clipboard"
        />
      </div>
    </section>
  );
}