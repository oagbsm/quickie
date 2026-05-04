const asset = (path: string) => `/quickola/${path}`;

const categories = [
  {
    title: "Cleaners",
    text: "Home cleans, end of tenancy, offices and same-day help.",
    color: "text-[#08783f]",
    ring: "bg-[#edf7ef] ring-[#d8eddd]",
    arrow: "bg-[#08783f] text-white",
    image: "cleaners.png",
  },
  {
    title: "Man with van",
    text: "Small moves, collections, deliveries and urgent removals.",
    color: "text-[#5b2bbd]",
    ring: "bg-[#f1eafe] ring-[#ded2fa]",
    arrow: "bg-[#5b2bbd] text-white",
    image: "van.png",
  },
  {
    title: "Plumbers",
    text: "Leaks, repairs, installations and emergency callouts.",
    color: "text-[#0e65c7]",
    ring: "bg-[#eaf3ff] ring-[#cfe2fb]",
    arrow: "bg-[#0e65c7] text-white",
    image: "plumbers.png",
  },
];

export default function Categories() {
  return (
    <section className="relative z-10 bg-white px-5 pb-8 pt-7 sm:px-8 lg:px-[60px] lg:pb-10 lg:pt-8">
      <div className="mx-auto max-w-[1220px]">
        <div className="mx-auto max-w-[640px] text-center">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#08783f]">
            Start with the main services
          </p>

          <h2 className="mt-3 text-[34px] font-extrabold leading-[1.05] tracking-[-0.025em] text-[#071638] sm:text-[42px]">
            What do you need help{" "}
            <span className="relative inline-block">
              with?
              <span className="absolute -bottom-1 left-0 h-[5px] w-full rounded-full bg-[#22b35c]/75" />
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-[520px] text-[16px] font-semibold leading-[1.5] text-[#44506a] sm:text-[17px]">
            Pick a category, tell us your area, and see what a fair local price should look like.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3 lg:gap-7">
          {categories.map((category) => (
            <a
              href="https://tally.so/r/81jNvr"
              key={category.title}
              className="group relative overflow-hidden rounded-[22px] border border-[#dfe5ee] bg-white px-6 py-7 text-center shadow-[0_18px_45px_rgba(7,22,56,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(7,22,56,0.11)] sm:px-7 lg:min-h-[270px]"
            >
              <div className="absolute inset-x-0 top-0 h-[5px] bg-[linear-gradient(90deg,#08783f,#9adc36)] opacity-0 transition group-hover:opacity-100" />

              <div
                className={`mx-auto grid h-[104px] w-[104px] place-items-center rounded-full ring-1 ${category.ring}`}
              >
                <img
                  src={asset(category.image)}
                  alt=""
                  className="h-[86px] w-[104px] object-contain transition duration-200 group-hover:scale-[1.04]"
                />
              </div>

              <h3
                className={`mt-5 text-[27px] font-extrabold leading-none tracking-[-0.025em] ${category.color}`}
              >
                {category.title}
              </h3>

              <p className="mx-auto mt-3 max-w-[260px] text-[15px] font-semibold leading-[1.45] text-[#44506a]">
                {category.text}
              </p>

              <div className="mt-6 flex items-center justify-center gap-3 text-[14px] font-extrabold text-[#071638]">
                Check price
                <span
                  className={`grid h-[34px] w-[34px] place-items-center rounded-full text-[21px] leading-none shadow-[0_10px_20px_rgba(7,22,56,0.12)] transition group-hover:translate-x-1 ${category.arrow}`}
                >
                  →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}