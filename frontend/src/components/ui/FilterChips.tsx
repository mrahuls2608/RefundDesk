import { cx } from './cx';

export interface FilterChip<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface FilterChipsProps<T extends string> {
  label: string;
  chips: FilterChip<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

/** Toggle buttons with aria-pressed (Design §5.12). */
export function FilterChips<T extends string>({ label, chips, selected, onSelect }: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const pressed = chip.value === selected;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onSelect(chip.value)}
            className={cx(
              'inline-flex h-9 items-center gap-1 rounded-full border px-3 text-small font-medium transition-colors duration-fast',
              pressed ? 'border-primary-600 bg-primary-600 text-text-inverse' : 'border-border bg-surface text-text hover:border-border-strong',
            )}
          >
            {chip.label}
            {chip.count !== undefined && <span className="tabular">{chip.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
