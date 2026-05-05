const categories = [
  {
    title: "Cleaning",
    text: "Home cleaning, regular cleans and one-off help.",
    icon: "✣",
    service: "cleaning",
    area: "london",
  },
  {
    title: "End of tenancy",
    text: "Move-out cleans, deposit cleans and deep property cleans.",
    icon: "⌂",
    service: "end-of-tenancy-cleaning",
    area: "london",
  },
  {
    title: "Man and van",
    text: "Small moves, collections, deliveries and urgent van jobs.",
    icon: "▱",
    service: "man-and-van",
    area: "london",
  },
  {
    title: "Removals",
    text: "Flat moves, house moves and larger moving jobs.",
    icon: "⇄",
    service: "removals",
    area: "london",
  },
  {
    title: "Plumber",
    text: "Leaks, repairs, callouts and common plumbing jobs.",
    icon: "◈",
    service: "plumber",
    area: "london",
  },
  {
    title: "Electrician",
    text: "Faults, sockets, lighting and electrical callouts.",
    icon: "⚡",
    service: "electrician",
    area: "london",
  },
  {
    title: "Locksmith",
    text: "Lockouts, lock changes and urgent lock help.",
    icon: "◇",
    service: "locksmith",
    area: "london",
  },
  {
    title: "Handyman",
    text: "Small repairs, odd jobs and flat pack assembly.",
    icon: "✦",
    service: "handyman",
    area: "london",
  },
  {
    title: "Gardener",
    text: "Garden maintenance, hedge trimming and clearances.",
    icon: "☘",
    service: "gardener",
    area: "london",
  },
  {
    title: "Pest control",
    text: "Mice, insects, wasps and common pest treatments.",
    icon: "◎",
    service: "pest-control",
    area: "london",
  },
  {
    title: "Painter",
    text: "Room painting, decorating and property refreshes.",
    icon: "▰",
    service: "painter-decorator",
    area: "london",
  },
  {
    title: "Carpet cleaning",
    text: "Room carpets, rugs, upholstery and stain cleaning.",
    icon: "▥",
    service: "carpet-cleaning",
    area: "london",
  },
  {
    title: "Oven cleaning",
    text: "Single ovens, double ovens, hobs and extractors.",
    icon: "□",
    service: "oven-cleaning",
    area: "london",
  },
  {
    title: "Waste removal",
    text: "Rubbish removal, junk clearance and small loads.",
    icon: "▤",
    service: "waste-removal",
    area: "london",
  },
  {
    title: "Appliance repair",
    text: "Washing machines, fridges, dishwashers and callouts.",
    icon: "◌",
    service: "appliance-repair",
    area: "london",
  },
];

export default function Categories() {
  return (
    <section className="relative z-10 bg-white px-5 pb-10 pt-8 sm:px-8 lg:px-[60px] lg:pb-12 lg:pt-10">
      <div className="mx-auto max-w-[1220px]">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#08783f]">
            Popular local services
          </p>

          <h2 className="mt-3 text-[34px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#071638] sm:text-[44px]">
            Check the fair price before you book
          </h2>

          <p className="mx-auto mt-4 max-w-[580px] text-[16px] font-semibold leading-[1.55] text-[#44506a] sm:text-[17px]">
            Choose a service, enter your area, and see what a fair local price should usually look like.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((category) => (
            <a
              href={`/check-price?service=${category.service}&area=${category.area}`}
              key={category.title}
              className="group relative flex min-h-[170px] flex-col rounded-[20px] border border-[#dfe5ee] bg-white p-5 shadow-[0_12px_30px_rgba(7,22,56,0.045)] transition duration-200 hover:-translate-y-1 hover:border-[#08783f]/35 hover:shadow-[0_20px_45px_rgba(7,22,56,0.085)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#f0faf3] text-[22px] font-black text-[#08783f] ring-1 ring-[#d8eddd]">
                  {category.icon}
                </div>

                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#071638] text-[19px] leading-none text-white shadow-[0_10px_20px_rgba(7,22,56,0.14)] transition group-hover:translate-x-1 group-hover:bg-[#08783f]">
                  →
                </span>
              </div>

              <h3 className="mt-5 text-[20px] font-extrabold leading-[1.05] tracking-[-0.025em] text-[#071638]">
                {category.title}
              </h3>

              <p className="mt-2 text-[13px] font-semibold leading-[1.45] text-[#556177]">
                {category.text}
              </p>

              <p className="mt-auto pt-5 text-[13px] font-extrabold text-[#08783f]">
                Check price
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}