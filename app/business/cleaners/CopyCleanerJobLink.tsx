"use client";

import { useState } from "react";

export default function CopyCleanerJobLink({ jobLink }: { jobLink: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(jobLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={copy} className="min-h-10 rounded-lg border px-3 text-sm font-bold text-[#245b9d]">
        Copy cleaner job link
      </button>
      <span className="text-xs text-[#657089]">For an accepted cleaner to open this clean.</span>
      {copied && <span role="status" className="text-xs font-bold text-emerald-800">Job link copied</span>}
    </div>
  );
}
