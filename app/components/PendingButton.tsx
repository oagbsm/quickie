"use client";

import { useFormStatus } from "react-dom";

export default function PendingButton({
  idle,
  pending,
  className,
  children,
}: {
  idle?: string;
  pending?: string;
  className: string;
  children?: React.ReactNode;
}) {
  const { pending: isPending } = useFormStatus();
  return (
    <button
      disabled={isPending}
      aria-live="polite"
      className={`${className} disabled:cursor-wait disabled:opacity-60`}
    >
      {isPending ? (pending || "Saving…") : (idle || children)}
    </button>
  );
}
