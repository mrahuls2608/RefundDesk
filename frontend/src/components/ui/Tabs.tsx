'use client';

import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './cx';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  content: ReactNode;
}

export interface TabsProps<T extends string> {
  label: string;
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** WAI-ARIA tabs with roving tabindex and arrow / Home / End navigation. */
export function Tabs<T extends string>({ label, tabs, value, onChange }: TabsProps<T>) {
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.value === value));

  const onKeyDown = (event: KeyboardEvent) => {
    const last = tabs.length - 1;
    const target =
      event.key === 'ArrowRight' ? (activeIndex === last ? 0 : activeIndex + 1)
      : event.key === 'ArrowLeft' ? (activeIndex === 0 ? last : activeIndex - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (target === null) return;
    event.preventDefault();
    onChange(tabs[target]!.value);
    refs.current[target]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 border-b border-border" onKeyDown={onKeyDown}>
        {tabs.map((tab, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={tab.value}
              ref={(el) => {
                refs.current[index] = el;
              }}
              id={`${baseId}-tab-${tab.value}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.value}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.value)}
              className={cx('-mb-px min-h-touch border-b-2 px-3 text-small font-medium', selected ? 'border-primary-600 text-text' : 'border-transparent text-text-muted hover:text-text')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.value}
          id={`${baseId}-panel-${tab.value}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab.value}`}
          hidden={index !== activeIndex}
          tabIndex={0}
          className="pt-4"
        >
          {index === activeIndex && tab.content}
        </div>
      ))}
    </div>
  );
}
