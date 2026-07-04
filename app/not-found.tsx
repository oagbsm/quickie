import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f8fbff] px-4 py-10 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <section className="mx-auto flex min-h-[75vh] max-w-[760px] flex-col items-center justify-center text-center">
        <div className="inline-flex rounded-full bg-[#edf8f1] px-4 py-2 text-[12px] font-black uppercase tracking-[0.09em] text-[#08783f]">
          Page not found
        </div>

        <h1 className="mt-5 text-[42px] font-black leading-[1.02] tracking-[-0.065em] text-[#071638] sm:text-[64px]">
          This price check page doesn’t exist.
        </h1>

        <p className="mt-4 max-w-[560px] text-[16px] font-semibold leading-[1.55] text-[#44506a] sm:text-[18px]">
          The link may be wrong, moved, or not available yet. Quickola is currently focused on cleaning in Slough.
        </p>

        <div className="mt-7 grid w-full max-w-[460px] gap-3 sm:grid-cols-2">
          <Link
            href="/"
            className="flex h-[54px] items-center justify-center rounded-[15px] bg-[#075cff] px-5 text-[15px] font-black text-white shadow-[0_16px_30px_rgba(0,92,255,0.22)] transition hover:-translate-y-0.5 hover:bg-[#004fe6]"
          >
            Request a cleaner
          </Link>

          <Link
            href="/"
            className="flex h-[54px] items-center justify-center rounded-[15px] border border-[#dce5f2] bg-white px-5 text-[15px] font-black text-[#071638] transition hover:-translate-y-0.5 hover:border-[#b7c2d2]"
          >
            Back to home
          </Link>
        </div>

        <div className="mt-8 rounded-[22px] border border-[#dbe8ff] bg-white p-4 shadow-[0_14px_34px_rgba(7,22,56,0.055)]">
          <p className="text-[13px] font-black text-[#071638]">
            Cleaning pages
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {[
              { label: "Cleaners in Slough", href: "/cleaners-slough" },
              { label: "Regular cleaner", href: "/regular-cleaner-slough" },
              { label: "Deep cleaning", href: "/deep-cleaning-slough" },
              { label: "End of tenancy", href: "/end-of-tenancy-cleaning-slough" },
              { label: "Airbnb cleaning", href: "/airbnb-cleaning-slough" },
              { label: "After builders", href: "/after-builders-cleaning-slough" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full bg-[#f3f7ff] px-3 py-2 text-[12px] font-black text-[#075cff]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}