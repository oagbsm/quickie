"use client";

import { useFormStatus } from "react-dom";

export default function PendingButton({
  idle,
  pending,
  className,
}: {
  idle: string;
  pending: string;
  className: string;
}) {
  const { pending: isPending } = useFormStatus();
  return (
    <button
      disabled={isPending}
      aria-live="polite"
      className={`${className} disabled:cursor-wait disabled:opacity-60`}
    >
      {isPending ? pending : idle}
    </button>
  );
}
