const trustItems = [
  {
    title: "No paid ranking",
    text: "We don’t take money to list or rank businesses.",
    icon: "shield",
  },
  {
    title: "Fair price ranges",
    text: "Get an idea of the fair price before you book.",
    icon: "tag",
  },
  {
    title: "Real local providers",
    text: "Verified local businesses in your area.",
    icon: "people",
  },
  {
    title: "Reviews from customers",
    text: "Honest reviews from real people like you.",
    icon: "star",
  },
];

function TrustIcon({ type }: { type: string }) {
  const base =
    "h-[42px] w-[42px] shrink-0 fill-none stroke-[#08783f] stroke-[2.1]";

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

  if (type === "people") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={base}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16.5 19.2v-1.3a3.5 3.5 0 0 0-3.5-3.5h-2a3.5 3.5 0 0 0-3.5 3.5v1.3" />
        <path d="M8.8 8.6a3.2 3.2 0 1 0 6.4 0 3.2 3.2 0 0 0-6.4 0Z" />
        <path d="M18 19.2v-1.1a3.2 3.2 0 0 0-2.3-3" />
        <path d="M16.5 6.3a2.7 2.7 0 0 1 0 5.2" />
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
    <section className="relative z-20 -mt-[38px] bg-white px-5 pb-4 sm:px-8 lg:px-[60px]">
      <div className="mx-auto max-w-[1220px] overflow-hidden rounded-[22px] border border-[#dfe5ee] bg-white shadow-[0_24px_70px_rgba(7,22,56,0.12)]">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, index) => (
            <div
              key={item.title}
              className={`group flex min-h-[126px] items-center gap-[18px] bg-white px-6 py-6 transition hover:bg-[#f8fbf9] lg:px-7 ${
                index > 0 ? "lg:border-l lg:border-[#dfe5ee]" : ""
              } ${index > 1 ? "sm:border-t sm:border-[#dfe5ee] lg:border-t-0" : ""}`}
            >
              <div className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-[18px] bg-[#f1faf3] ring-1 ring-[#d8eddd] transition group-hover:scale-[1.03]">
                <TrustIcon type={item.icon} />
              </div>

              <div>
                <h3 className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-[#071638]">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-[225px] text-[14.5px] font-medium leading-[1.45] tracking-[0em] text-[#44506a]">
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