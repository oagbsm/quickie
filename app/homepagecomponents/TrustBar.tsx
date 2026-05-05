const trustItems = [
  {
    title: "Price-first",
    text: "Check the fair local range before you decide what to do next.",
    icon: "tag",
  },
  {
    title: "15 service categories",
    text: "Cleaners, plumbers, removals, locksmiths, gardeners and more.",
    icon: "grid",
  },
  {
    title: "No booking pressure",
    text: "See the guide price first. Request a match only if useful.",
    icon: "shield",
  },
  {
    title: "Local request matching",
    text: "Submit once and Quickola can help find a suitable local provider.",
    icon: "star",
  },
];

function TrustIcon({ type }: { type: string }) {
  const base =
    "h-[34px] w-[34px] shrink-0 fill-none stroke-[#08783f] stroke-[2.2]";

  if (type === "tag") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={base}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.2 12.2 12 20.4a2.1 2.1 0 0 1-3 0L3.6 15a2.1 2.1 0 0 1 0-3L11.8 3.8h6.4v6.4Z" />
        <path d="M15.8 7.8h.01" />
      </svg>
    );
  }

  if (type === "grid") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={base}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />
      </svg>
    );
  }

  if (type === "star") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={base}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m12 3.7 2.6 5.2 5.7.8-4.1 4 1 5.7L12 17.6 6.8 20.3l1-5.7-4.1-4 5.7-.8L12 3.7Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={base}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5 5.5 6v5.1c0 4 2.6 7.5 6.5 9.1 3.9-1.6 6.5-5.1 6.5-9.1V6L12 3.5Z" />
      <path d="m15.8 10.3-4.6 4.6-2.1-2.1" />
    </svg>
  );
}

export default function TrustBar() {
  return (
    <section id="trust" className="relative z-20 -mt-[34px] bg-white px-5 pb-5 sm:px-8 lg:px-[60px]">
      <div className="mx-auto max-w-[1220px] overflow-hidden rounded-[24px] border border-[#dfe5ee] bg-white shadow-[0_22px_60px_rgba(7,22,56,0.10)]">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, index) => (
            <div
              key={item.title}
              className={`group flex min-h-[124px] items-center gap-4 bg-white px-5 py-5 transition hover:bg-[#f8fbf9] lg:px-6 ${
                index > 0 ? "lg:border-l lg:border-[#dfe5ee]" : ""
              } ${index > 1 ? "sm:border-t sm:border-[#dfe5ee] lg:border-t-0" : ""}`}
            >
              <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[17px] bg-[#f1faf3] ring-1 ring-[#d8eddd] transition group-hover:scale-[1.03]">
                <TrustIcon type={item.icon} />
              </div>

              <div>
                <h3 className="text-[17px] font-extrabold leading-[1.12] tracking-[-0.015em] text-[#071638]">
                  {item.title}
                </h3>
                <p className="mt-1.5 max-w-[240px] text-[13.5px] font-semibold leading-[1.42] text-[#44506a]">
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