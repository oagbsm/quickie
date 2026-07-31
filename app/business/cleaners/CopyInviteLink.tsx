"use client";

import { useState } from "react";

export default function CopyInviteLink({ inviteToken }: { inviteToken: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const inviteLink = new URL(`/invite/${encodeURIComponent(inviteToken)}`, window.location.origin).toString();
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={copy} className="min-h-11 rounded-lg bg-[#071f49] px-4 text-sm font-extrabold text-white">
        Copy invite link
      </button>
      <span className="text-xs text-[#657089]">Secure link for first-time access.</span>
      {copied && <span role="status" className="text-sm font-bold text-emerald-800">Invite link copied</span>}
    </div>
  );
}
