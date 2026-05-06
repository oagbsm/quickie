import { formatLabel } from "../lib/admin-utils";

type BadgeTone = "green" | "yellow" | "blue" | "red" | "dark" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  green: "border-[#bfe8cb] bg-[#effcf3] text-[#08783f]",
  yellow: "border-[#ead89a] bg-[#fff9e8] text-[#8a6400]",
  blue: "border-[#cbdcf7] bg-[#eef6ff] text-[#1954a6]",
  red: "border-[#ffd1d1] bg-[#fff1f1] text-[#b42318]",
  dark: "border-[#cfd5df] bg-[#071638] text-white",
  neutral: "border-[#dfe5ee] bg-[#f7f9fb] text-[#44506a]",
};

export default function StatusBadge({
  value,
  tone = "neutral",
  className = "",
}: {
  value: string | null | undefined;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-8 items-center justify-center rounded-full border px-3 text-[12px] font-black leading-none ${toneClasses[tone]} ${className}`}
    >
      {formatLabel(value)}
    </span>
  );
}
