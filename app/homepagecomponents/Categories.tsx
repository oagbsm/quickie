const trustItems = [
  {
    icon: "shield",
    title: "Clear answers",
    text: "See the usual local price in seconds.",
  },
  {
    icon: "users",
    title: "Local help",
    text: "Get matched with trusted local pros.",
  },
  {
    icon: "lock",
    title: "You’re in control",
    text: "No pressure. Just the facts.",
  },
];

function TrustIcon({ type }: { type: string }) {
  const className = "h-[24px] w-[24px] fill-none stroke-current stroke-[2.15]";

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

  if (type === "users") {
    return (
      <svg viewBox="0 0 24 24" className={className} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 20v-1.7a3.8 3.8 0 0 0-3.8-3.8H7.8A3.8 3.8 0 0 0 4 18.3V20" />
        <circle cx="10" cy="7.5" r="3.5" />
        <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4" />
        <path d="M15.5 4.3a3.5 3.5 0 0 1 0 6.4" />
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
    <section className="bg-white px-5 pb-5 pt-3 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid grid-cols-3 overflow-hidden rounded-[18px] border border-[#e6ebf0] bg-white shadow-[0_8px_22px_rgba(7,22,56,0.035)]">
          {trustItems.map((item, index) => (
            <div
              key={item.title}
              className={`flex min-h-[82px] items-center justify-center gap-2.5 px-3 py-3 text-left ${
                index !== trustItems.length - 1 ? "border-r border-[#e6ebf0]" : ""
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eff8f2] text-[#071638]">
                <TrustIcon type={item.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-extrabold leading-[1.1] tracking-[-0.025em] text-[#071638] sm:text-[14px]">
                  {item.title}
                </p>
                <p className="mt-1 text-[10.8px] font-semibold leading-[1.18] tracking-[-0.015em] text-[#52627a] sm:text-[12px]">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}