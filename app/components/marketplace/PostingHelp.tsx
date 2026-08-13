"use client";

import { useState } from "react";

export default function PostingHelp() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="mt-4 min-h-11 text-left text-base font-black text-[#167d3c] underline underline-offset-4">Need help posting a job?</button>
    {open && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#061b3f]/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="posting-help-title" className="w-full max-w-md rounded-3xl bg-white p-6 text-[#061b3f] shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><h2 id="posting-help-title" className="text-2xl font-black">Posting a job is simple</h2><button type="button" onClick={() => setOpen(false)} aria-label="Close help" className="grid min-h-11 min-w-11 place-items-center rounded-xl text-2xl font-bold text-[#526078]">×</button></div>
        <ol className="mt-5 grid gap-4 text-base leading-6"><li><strong>1. Tell us what you need.</strong><br />Choose a service, add the postcode and say when you need help.</li><li><strong>2. People send offers.</strong><br />You can look at the offers before deciding.</li><li><strong>3. Choose when you are happy.</strong><br />Posting does not mean you have accepted anyone.</li></ol>
        <button type="button" onClick={() => setOpen(false)} className="mt-6 min-h-12 w-full rounded-xl bg-[#23a955] px-5 text-base font-black text-[#061b3f]">Close</button>
      </section>
    </div>}
  </>;
}
