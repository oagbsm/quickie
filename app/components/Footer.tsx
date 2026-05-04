export default function Footer() {
  return (
    <footer className="border-t border-[#e1e6ee] bg-white px-4 py-8 text-[#071638] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-[520px]">
          <div className="flex items-center gap-3">
            <img
              src="/quickola/logo-mark.png"
              alt="Quickola"
              className="h-9 w-9 rounded-full object-contain"
            />
            <p className="text-[22px] font-extrabold tracking-[-0.04em]">
              Quickola
            </p>
          </div>

          <p className="mt-3 text-[13px] font-semibold leading-[1.55] text-[#657089]">
            Quickola helps users check estimated fair local price ranges and request a best-match provider. Prices are estimates, not final quotes.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-[14px] font-extrabold text-[#071638]">
          <a href="/privacy" className="hover:text-[#08783f]">Privacy</a>
          <a href="/terms" className="hover:text-[#08783f]">Terms</a>
          <a href="mailto:hello@quickola.com" className="hover:text-[#08783f]">Contact</a>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-[1120px] text-[12px] font-semibold text-[#8b94a7]">
        © {new Date().getFullYear()} Quickola. All rights reserved.
      </div>
    </footer>
  );
}