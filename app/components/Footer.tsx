export default function Footer() {
  return (
    <footer className="border-t border-[#e1e6ee] bg-white px-4 py-8 text-[#071638] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1220px] flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-[560px]">
          <a href="/" className="flex items-center gap-3" aria-label="Quickola homepage">
            <img
              src="/quickola/logo-mark.png"
              alt="Quickola"
              className="h-10 w-10 rounded-full object-contain"
            />
            <p className="text-[23px] font-bold tracking-[0.025em]">
              Quickola
            </p>
          </a>

          <p className="mt-3 text-[13.5px] font-semibold leading-[1.6] text-[#657089]">
            Quickola helps people check fair cleaning price ranges before they book. Prices are guides, not final quotes, and availability can vary by area and job type.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-extrabold text-[#44506a]">
            <span className="rounded-full border border-[#e1e6ee] bg-[#fbfcfd] px-3 py-1.5">No paid ranking</span>
            <span className="rounded-full border border-[#e1e6ee] bg-[#fbfcfd] px-3 py-1.5">Fair price first</span>
            <span className="rounded-full border border-[#e1e6ee] bg-[#fbfcfd] px-3 py-1.5">Cleaning only while we launch</span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 sm:text-right">
          <div>
            <p className="mb-3 text-[12px] font-black uppercase tracking-[0.08em] text-[#8b94a7]">
              Quickola
            </p>
            <div className="grid gap-2 text-[14px] font-extrabold text-[#071638]">
              <a href="/about" className="hover:text-[#08783f]">About</a>
              <a href="/contact" className="hover:text-[#08783f]">Contact</a>
              <a href="/cleaning-london" className="hover:text-[#08783f]">Cleaning prices</a>
              <a href="/for-cleaners" className="hover:text-[#08783f]">Join as a cleaner</a>
            </div>
          </div>

          <div>
            <p className="mb-3 text-[12px] font-black uppercase tracking-[0.08em] text-[#8b94a7]">
              Legal
            </p>
            <div className="grid gap-2 text-[14px] font-extrabold text-[#071638]">
              <a href="/privacy-policy" className="hover:text-[#08783f]">Privacy Policy</a>
              <a href="/terms" className="hover:text-[#08783f]">Terms</a>
              <a href="mailto:hello@quickola.co.uk" className="hover:text-[#08783f]">hello@quickola.co.uk</a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-7 flex max-w-[1220px] flex-col gap-2 border-t border-[#edf0f5] pt-5 text-[12px] font-semibold text-[#8b94a7] sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Quickola. All rights reserved.</p>
        <p>Built for fair cleaning price checks across London.</p>
      </div>
    </footer>
  );
}