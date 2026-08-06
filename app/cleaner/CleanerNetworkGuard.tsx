"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CleanerNetworkGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [connection, setConnection] = useState<"online" | "offline" | "reconnecting">("online");
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const reconcile = async (attempt = 0) => {
      if (cancelled || !navigator.onLine) return;
      setConnection("reconnecting");
      try {
        const response = await fetch(window.location.href, { method: "HEAD", cache: "no-store", credentials: "same-origin" });
        if (!response.ok) throw new Error(`read_${response.status}`);
        if (cancelled) return;
        router.refresh();
        setConnection("online");
        setShowBackOnline(true);
        retryTimer = setTimeout(() => setShowBackOnline(false), 2200);
      } catch {
        if (attempt < 2) {
          retryTimer = setTimeout(() => reconcile(attempt + 1), attempt === 0 ? 250 : 750);
        } else if (!cancelled) {
          setConnection("offline");
        }
      }
    };

    const wentOffline = () => {
      if (retryTimer) clearTimeout(retryTimer);
      setConnection("offline");
      setShowBackOnline(false);
    };
    const cameOnline = () => reconcile();
    window.addEventListener("offline", wentOffline);
    window.addEventListener("online", cameOnline);
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("offline", wentOffline);
      window.removeEventListener("online", cameOnline);
    };
  }, [router]);

  return <>
    {connection !== "online" && <div role="status" className="sticky top-16 z-20 mx-auto mb-3 max-w-4xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">{connection === "reconnecting" ? "Connection interrupted — reconnecting…" : "Connection interrupted — reconnecting…"}<button type="button" onClick={() => window.dispatchEvent(new Event("online"))} className="ml-3 underline">Retry</button></div>}
    {showBackOnline && <div role="status" className="sticky top-16 z-20 mx-auto mb-3 max-w-4xl rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">Back online ✓</div>}
    {children}
  </>;
}
