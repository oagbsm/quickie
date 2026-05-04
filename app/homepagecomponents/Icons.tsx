export function StarTiny() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-[#08783f] stroke-[2.4]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3Z" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-[#071638] stroke-[2.2]"
      strokeLinecap="round"
    >
      <circle cx="10.8" cy="10.8" r="6.7" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-[#071638] stroke-[2.2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

export function TargetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-[#071638] stroke-[2]"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </svg>
  );
}

export function TrustIcon({ type }: { type: string }) {
  const base =
    "h-[42px] w-[42px] shrink-0 fill-none stroke-[#08783f] stroke-[2.1]";

  if (type === "tag") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={base}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.2 12.2 12 20.4a2.1 2.1 0 0 1-3 0L3.6 15a2.1 2.1 0 0 1 0-3L11.8 3.8h6.4v6.4Z" />
      </svg>
    );
  }

  if (type === "people") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={base}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16.5 19.2v-1.3a3.5 3.5 0 0 0-3.5-3.5h-2a3.5 3.5 0 0 0-3.5 3.5v1.3M8.8 8.6a3.2 3.2 0 1 0 6.4 0 3.2 3.2 0 0 0-6.4 0Zm9.2 10.6v-1.1a3.2 3.2 0 0 0-2.3-3" />
      </svg>
    );
  }

  if (type === "star") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={base}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m12 3.7 2.6 5.2 5.7.8-4.1 4 1 5.7L12 17.6 6.8 20.3l1-5.7-4.1-4 5.7-.8L12 3.7Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={base}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5 5.5 6v5.1c0 4 2.6 7.5 6.5 9.1 3.9-1.6 6.5-5.1 6.5-9.1V6L12 3.5Zm3.8 6.8-4.6 4.6-2.1-2.1" />
    </svg>
  );
}