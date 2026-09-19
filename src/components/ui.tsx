import type { Difficulty } from "@/lib/types";

export function DifficultyBadge({ level }: { level: Difficulty }) {
  const cls =
    level === "easy"
      ? "bg-emerald-400/10 text-emerald-300"
      : level === "medium"
        ? "bg-amber-400/10 text-amber-300"
        : "bg-rose-400/10 text-rose-300";
  const label = level === "easy" ? "Easy" : level === "medium" ? "Medium" : "Hard";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-[#0e141c]/80 ${className}`}>
      {children}
    </div>
  );
}
