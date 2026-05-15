export function StarTiny() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-[#08783f] stroke-[2.4]"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3Z" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-none stroke-[#071638] stroke-[2.25]"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10.7" cy="10.7" r="6.6" />
      <path d="m15.6 15.6 4.4 4.4" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-none stroke-[#071638] stroke-[2.35]"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s6.5-5.8 6.5-11.2a6.5 6.5 0 1 0-13 0C5.5 15.2 12 21 12 21Z" />
      <circle cx="12" cy="9.8" r="2.35" />
    </svg>
  );
}

export function TargetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-none stroke-[#071638] stroke-[2.15]"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="7.2" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 2.6v3.1M12 18.3v3.1M2.6 12h3.1M18.3 12h3.1" />
    </svg>
  );
}

export function CleaningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.1]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3 5 12" />
      <path d="m12 5 7 7" />
      <path d="M4.5 13.5 10.5 19.5" />
      <path d="M3 21h10" />
      <path d="M7 16l-3 5" />
      <path d="M10 19l1.7-3.2" />
    </svg>
  );
}

export function PlumberIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.1]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4.5a4.5 4.5 0 0 0 5 5L10 19a3 3 0 0 1-4.2 0l-.8-.8a3 3 0 0 1 0-4.2l9.5-9.5Z" />
      <path d="m13 7 4 4" />
      <path d="m5.5 16.5 2 2" />
    </svg>
  );
}

export function VanIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.1]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h3.6l2.4 3v3h-6" />
      <path d="M6.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M17.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M8.5 16h7" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.1]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2.5" />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}

export function TrustIcon({ type }: { type: string }) {
  const base = "h-[38px] w-[38px] shrink-0 fill-none stroke-[#08783f] stroke-[2.1]";

  if (type === "tag") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 12.3 12.3 20a2.2 2.2 0 0 1-3.1 0L4 14.8a2.2 2.2 0 0 1 0-3.1L11.7 4H18v6.3Z" />
        <circle cx="15.6" cy="8.4" r="1.2" />
      </svg>
    );
  }

  if (type === "people") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8.5 11.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
        <path d="M3.5 20v-1.3a4.7 4.7 0 0 1 4.7-4.7h.6a4.7 4.7 0 0 1 4.7 4.7V20" />
        <path d="M16.5 11.8a2.6 2.6 0 1 0 0-5.2" />
        <path d="M16.8 14.2a4 4 0 0 1 3.7 4V20" />
      </svg>
    );
  }

  if (type === "star") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 3.5 2.7 5.4 6 .9-4.3 4.2 1 6-5.4-2.9L6.6 20l1-6-4.3-4.2 6-.9L12 3.5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5 5.5 6v5.2c0 4 2.6 7.6 6.5 9.3 3.9-1.7 6.5-5.3 6.5-9.3V6L12 3.5Z" />
      <path d="m8.8 12.2 2.1 2.1 4.5-4.6" />
    </svg>
  );
}