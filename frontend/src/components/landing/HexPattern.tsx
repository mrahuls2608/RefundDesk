import { cx } from "@/components/ui";

/** Decorative hexagon line art for forest panels. Drifts slowly; frozen under reduced motion. */
export function HexPattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 260"
      fill="none"
      className={cx(
        "pointer-events-none absolute animate-drift text-forest-line",
        className,
      )}
    >
      {(
        [
          [60, 40],
          [140, 40],
          [100, 110],
          [20, 110],
          [60, 180],
          [140, 180],
        ] as const
      ).map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x} ${y - 36} L${x + 31} ${y - 18} L${x + 31} ${y + 18} L${x} ${y + 36} L${x - 31} ${y + 18} L${x - 31} ${y - 18} Z`}
          stroke="currentColor"
          strokeWidth="10"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
