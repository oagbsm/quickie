const trustItems = [
  {
    icon: "data",
    title: "Real data",
    text: "from real jobs",
  },
  {
    icon: "ranking",
    title: "No hidden",
    text: "ranking",
  },
  {
    icon: "shield",
    title: "Built to protect",
    text: "you from overpaying",
  },
  {
    icon: "clock",
    title: "We respect",
    text: "your time",
  },
  {
    icon: "lock",
    title: "You stay in",
    text: "control",
  },
];

function TrustIcon({ type }: { type: string }) {
  const className = "h-[23px] w-[23px] fill-none stroke-current stroke-[2]";

  if (type === "data") {
    return (
      <svg viewBox="0 0 24 24" className={className} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="6" width="16" height="13" rx="2" />
        <path d="M8 10h8" />
        <path d="M8 14h3" />
        <path d="M15 3v5" />
        <path d="M9 3v5" />
      </svg>
    );
  }

  if (type === "ranking") {
    return (
      <svg viewBox="0 0 24 24" className={className} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 4c3 2 5 5 5 8.3A5 5 0 0 1 7 12.3C7 9 9 6 12 4Z" />
        <path d="M9.5 14.5h5" />
        <path d="M12 8v8" />
      </svg>
    );
  }

  if (type === "shield") {
    return (
      <svg viewBox="0 0 24 24" className={className} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 19 6v5c0 4.7-2.8 8.2-7 10-4.2-1.8-7-5.3-7-10V6l7-3Z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    );
  }

  if (type === "clock") {
    return (
      <svg viewBox="0 0 24 24" className={className} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 10V8a5 5 0 0 1 10 0v2" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M12 14v2" />
    </svg>
  );
}

export default function Categories() {
  return (
    <section className="bg-white px-5 pb-8 pt-5 sm:px-8 lg:px-10 lg:pb-8 lg:pt-4">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid grid-cols-2 overflow-hidden rounded-[16px] border border-[#e4e9ef] bg-white shadow-[0_10px_26px_rgba(7,22,56,0.035)] sm:grid-cols-5 lg:border-0 lg:shadow-none">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="flex min-h-[92px] flex-col items-center justify-center border-[#e4e9ef] px-3 py-4 text-center text-[#079448] odd:border-r sm:border-r sm:last:border-r-0 lg:min-h-[106px]"
            >
              <TrustIcon type={item.icon} />
              <p className="mt-2 text-[12px] font-black leading-[1.2] tracking-[-0.02em] text-[#071638] sm:text-[13px]">
                {item.title}
              </p>
              <p className="mt-0.5 text-[11px] font-bold leading-[1.25] tracking-[-0.015em] text-[#071638] sm:text-[12px]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}