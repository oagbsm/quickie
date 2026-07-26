"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";

function LinkFeedback() {
  const { pending } = useLinkStatus();

  return (
    <span
      className="relative grid h-6 w-6 shrink-0 place-items-center"
      aria-live="polite"
    >
      <span
        className={`absolute h-4 w-4 rounded-full border-2 border-[#075fe4]/25 border-t-[#075fe4] transition-opacity motion-safe:animate-spin ${pending ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 20 20"
        className={`h-5 w-5 transition-[opacity,transform] group-hover:translate-x-0.5 ${pending ? "opacity-0" : "opacity-100"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m7 4 6 6-6 6" />
      </svg>
      {pending && <span className="sr-only">Loading destination</span>}
    </span>
  );
}

export default function DashboardCardLink({
  href,
  ariaLabel,
  actionLabel,
  children,
  className = "",
}: {
  href: string;
  ariaLabel: string;
  actionLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`group flex min-h-32 cursor-pointer touch-manipulation flex-col rounded-xl border border-[#dfe5e9] bg-white p-5 shadow-[0_8px_25px_rgba(7,22,56,.035)] outline-none transition-[transform,border-color,box-shadow,background-color] hover:-translate-y-0.5 hover:border-[#b8c5d8] hover:shadow-[0_12px_30px_rgba(7,22,56,.09)] focus-visible:ring-4 focus-visible:ring-[#2e68bb]/30 active:translate-y-0 active:scale-[.985] active:bg-[#f4f7fb] xl:p-6 ${className}`}
    >
      <div className="flex flex-1 items-center">{children}</div>
      <span className="mt-3 flex min-h-11 items-center justify-between gap-3 border-t border-[#edf0f3] pt-3 text-sm font-extrabold text-[#075fe4]">
        {actionLabel}
        <LinkFeedback />
      </span>
    </Link>
  );
}
