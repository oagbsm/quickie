function WarningIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true">
      <path d="M12 2.9c.7 0 1.35.38 1.7 1l8.05 14.15A1.98 1.98 0 0 1 20.05 21H3.95a1.98 1.98 0 0 1-1.7-2.95L10.3 3.9c.35-.62 1-1 1.7-1Zm0 5.1c-.58 0-1.05.47-1.05 1.05v4.25c0 .58.47 1.05 1.05 1.05s1.05-.47 1.05-1.05V9.05C13.05 8.47 12.58 8 12 8Zm0 9.9a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
    </svg>
  );
}

export function ExpensiveQuoteCard({ quote }: { quote: string }) {
  return (
    <section className="relative overflow-hidden rounded-[18px] border border-[#f5c7c7] bg-white p-3.5 shadow-[0_12px_28px_rgba(127,29,29,0.08)] sm:p-4">
      <div className="relative z-10 flex min-h-[118px] items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-black leading-none tracking-[-0.03em] text-[#071638] sm:text-[18px]">
            Your quote
          </p>

          <div className="mt-2 text-[38px] font-black leading-[0.9] tracking-[-0.06em] text-[#d71920] sm:text-[50px]">
            {quote}
          </div>

          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-[10px] border border-[#ffcaca] bg-[#fff0f0] px-3 py-2 text-left text-[14px] font-black leading-none text-[#7f1d1d] sm:text-[16px]">
            <WarningIcon className="h-5 w-5 shrink-0 text-[#ef1f2d]" />
            <span className="truncate">Smells expensive</span>
          </div>
        </div>

        <div className="flex h-[148px] w-[148px] shrink-0 items-end justify-center sm:h-[166px] sm:w-[178px]">
          <img
            src="/quickola-koala-expensive.png"
            alt=""
            className="h-[148px] w-[148px] translate-y-4 object-contain drop-shadow-[0_8px_12px_rgba(7,22,56,0.12)] sm:h-[174px] sm:w-[174px] sm:translate-y-5"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#eef9f1]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-full bg-[#08783f]" />
    </section>
  );
}