export interface ConfidenceMeterProps {
  value: number;
  label?: string;
}

/** Bar plus numeric text; the number carries the meaning, the bar is decoration. */
export function ConfidenceMeter({ value, label = 'Confidence' }: ConfidenceMeterProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="flex items-center gap-2">
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        className="h-2 flex-1 overflow-hidden rounded-full bg-border"
      >
        <div className="h-full rounded-full bg-ai-700" style={{ width: `${percent}%` }} />
      </div>
      <span className="tabular text-small font-medium text-text">{percent}%</span>
    </div>
  );
}
