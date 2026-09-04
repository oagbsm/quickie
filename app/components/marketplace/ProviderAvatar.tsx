"use client";

import { useState } from "react";

export default function ProviderAvatar({ src, name, className }: { src?: string | null; name: string; className: string }) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().slice(0, 1).toUpperCase() || "P";

  return <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eef8f1] text-lg font-black text-[#167d3c] ${className}`} aria-hidden={src && !failed ? undefined : "true"}>
    {src && !failed ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : initial}
  </div>;
}
