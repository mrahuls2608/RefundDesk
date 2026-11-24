'use client';

import { CircleCheck, LoaderCircle, Rows3, Rows4, Search, Sparkles, TriangleAlert, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PageError } from '@/components/layout/PageError';
import {
  Avatar, Button, EmptyState, FilterChips, Select, SkeletonList, SortableTh, StatusBadge, Table, Td, Th, cx, type Density,
} from '@/components/ui';
import type { CaseFilters } from '@/lib/api/endpoints';
import { useCases } from '@/lib/api/hooks';
import type { CaseListItem, CaseStatus, IssueType } from '@/lib/api/types';
import { formatAge, formatINR } from '@/lib/format';
import { ISSUE_LABEL, ISSUE_SHORT_LABEL } from '@/lib/labels';
import { usePageTitle } from '@/lib/usePageTitle';

const PAGE_SIZE = 20;
const OVERDUE_MINUTES = 24 * 60;

type ChipValue = 'needs-action' | 'all' | 'PROPOSED' | 'NEEDS_MANUAL_REVIEW' | 'INVESTIGATING' | 'CLOSED';

const CHIP_STATUSES: Record<ChipValue, CaseStatus[] | undefined> = {
  'needs-action': ['PROPOSED', 'NEEDS_MANUAL_REVIEW'],
  all: undefined,
  PROPOSED: ['PROPOSED'],
  NEEDS_MANUAL_REVIEW: ['NEEDS_MANUAL_REVIEW'],
  INVESTIGATING: ['OPEN', 'INVESTIGATING'],
  CLOSED: ['CLOSED'],
};

const CHIPS: { value: ChipValue; label: string }[] = [
  { value: 'needs-action', label: 'Needs action' },
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'NEEDS_MANUAL_REVIEW', label: 'Manual review' },
  { value: 'INVESTIGATING', label: 'AI working' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'all', label: 'All' },
];

export default function CaseQueuePage() {
  const headingRef = usePageTitle('Cases');
  const router = useRouter();
  const [chip, setChip] = useState<ChipValue>('needs-action');
  const [issueType, setIssueType] = useState<IssueType | ''>('');
  const [sort, setSort] = useState<'oldest' | 'newest'>('oldest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [density, setDensity] = useState<Density>('comfortable');
  const [focusedRow, setFocusedRow] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const filters: CaseFilters = { status: CHIP_STATUSES[chip], issueType, sort, q: search.trim() || undefined, page, size: PAGE_SIZE };
  const cases = useCases(filters);
  const items = cases.data?.items ?? [];
  const totalPages = cases.data ? Math.max(1, Math.ceil(cases.data.total / PAGE_SIZE)) : 1;

  useQueueShortcuts({
    focusSearch: () => searchRef.current?.focus(),
    move: (delta) => setFocusedRow((row) => Math.min(Math.max(0, row + delta), Math.max(0, items.length - 1))),
    open: () => items[focusedRow] && router.push(`/ops/cases/${items[focusedRow].id}`),
  });

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
    setFocusedRow(0);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none">
            Cases
          </h1>
          <p className="text-body text-text-muted">Disputes waiting for investigation, review or a decision.</p>
        </div>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="relative w-full sm:w-64">
          <label htmlFor="case-search" className="sr-only">
            Search by case ID
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            id="case-search"
            ref={searchRef}
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            placeholder="Search ID (press /)"
            inputMode="numeric"
            className="h-10 w-full rounded-sm border border-border bg-surface pl-9 pr-3 text-body"
          />
        </form>
      </div>

      <QueueStats selected={chip} onSelect={resetPage(setChip)} />

      <FilterChips label="Filter by status" chips={CHIPS} selected={chip} onSelect={resetPage(setChip)} />

      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Type"
          className="w-48"
          value={issueType}
          onChange={(e) => resetPage(setIssueType)(e.target.value as IssueType | '')}
          options={[{ value: '', label: 'All types' }, ...Object.entries(ISSUE_LABEL).map(([value, label]) => ({ value, label }))]}
        />
        <Select
          label="Sort"
          className="w-40"
          value={sort}
          onChange={(e) => resetPage(setSort)(e.target.value as 'oldest' | 'newest')}
          options={[
            { value: 'oldest', label: 'Oldest first' },
            { value: 'newest', label: 'Newest first' },
          ]}
        />
        <Button
          variant="ghost"
          aria-pressed={density === 'compact'}
          onClick={() => setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))}
          className="hidden lg:inline-flex"
        >
          {density === 'compact' ? <Rows4 aria-hidden="true" className="h-4 w-4" /> : <Rows3 aria-hidden="true" className="h-4 w-4" />}
          Compact rows
        </Button>
      </div>

      {cases.isPending && <SkeletonList label="Loading cases" />}
      {cases.isError && <PageError error={cases.error} onRetry={() => cases.refetch()} showTraceId />}
      {cases.data && items.length === 0 && <EmptyState title="No cases need action right now." description="Try another filter to see more cases." />}
      {items.length > 0 && (
        <>
          <div className="hidden lg:block">
            <CaseTable items={items} density={density} focusedRow={focusedRow} sort={sort} onSort={() => resetPage(setSort)(sort === 'oldest' ? 'newest' : 'oldest')} />
          </div>
          <ul className="flex flex-col gap-2 lg:hidden">
            {items.map((item) => (
              <li key={item.id}>
                <CaseCard item={item} />
              </li>
            ))}
          </ul>
          <nav aria-label="Pagination" className="flex items-center justify-between gap-2">
            <span className="text-small text-text-muted">
              Page {page + 1} of {totalPages} · {cases.data?.total} cases
            </span>
            <div className="flex gap-2">
              <Button size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </nav>
          <p className="hidden text-caption text-text-muted lg:block">Keyboard: / search · j/k move · Enter open</p>
        </>
      )}
    </>
  );
}

function CaseTable({ items, density, focusedRow, sort, onSort }: {
  items: CaseListItem[]; density: Density; focusedRow: number; sort: 'oldest' | 'newest'; onSort: () => void;
}) {
  return (
    <Table caption="Cases" density={density}>
      <thead>
        <tr>
          <Th>ID</Th>
          <Th>Customer</Th>
          <Th>Type</Th>
          <Th align="right">Amount</Th>
          <Th>Status</Th>
          <SortableTh label="Age" direction={sort === 'oldest' ? 'descending' : 'ascending'} onSort={onSort} />
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr
            key={item.id}
            style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
            className={cx('animate-fade-up transition-colors duration-150 hover:bg-primary-50', index === focusedRow && 'bg-primary-50')}
            aria-selected={index === focusedRow}
          >
            <Td>
              <Link href={`/ops/cases/${item.id}`} className="font-mono text-sm font-semibold text-primary-600 underline-offset-2 hover:underline">
                #{item.id}
              </Link>
            </Td>
            <Td>
              <span className="flex items-center gap-2">
                <Avatar name={item.customerName} />
                {item.customerName}
              </span>
            </Td>
            <Td>
              <span className="block">{ISSUE_SHORT_LABEL[item.issueType]}</span>
              <span className="block text-small text-text-muted">{item.merchant}</span>
            </Td>
            <Td align="right">
              <span className="tabular text-body font-semibold">{formatINR(item.amount)}</span>
            </Td>
            <Td>
              <StatusBadge audience="staff" status={item.status} />
            </Td>
            <Td>
              <Age item={item} />
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function CaseCard({ item }: { item: CaseListItem }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Link href={`/ops/cases/${item.id}`} className="text-h3 text-primary-600 underline">
          Case #{item.id}
        </Link>
        <StatusBadge audience="staff" status={item.status} />
      </div>
      <p className="text-body">
        {item.customerName} · {ISSUE_SHORT_LABEL[item.issueType]}
      </p>
      <div className="flex items-center justify-between text-small">
        <span className="tabular font-semibold">{formatINR(item.amount)}</span>
        <Age item={item} />
      </div>
    </div>
  );
}

function Age({ item }: { item: CaseListItem }) {
  const overdue = item.ageMinutes > OVERDUE_MINUTES && item.status !== 'CLOSED';
  return (
    <span className={cx('inline-flex items-center gap-1', overdue && 'font-medium text-warning-700')}>
      {overdue && <TriangleAlert aria-hidden="true" className="h-4 w-4" />}
      {formatAge(item.ageMinutes)}
      {overdue && <span> · Overdue</span>}
    </span>
  );
}

/** `/` focuses search, j/k move the row focus, Enter opens — ignored while typing in a field. */
function useQueueShortcuts(actions: { focusSearch: () => void; move: (delta: number) => void; open: () => void }) {
  const ref = useRef(actions);
  useEffect(() => {
    ref.current = actions;
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.metaKey || event.ctrlKey || event.altKey || target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === '/') {
        event.preventDefault();
        ref.current.focusSearch();
      } else if (event.key === 'j') ref.current.move(1);
      else if (event.key === 'k') ref.current.move(-1);
      else if (event.key === 'Enter' && target === document.body) ref.current.open();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}

interface StatCard {
  chip: ChipValue;
  label: string;
  statuses: CaseStatus[];
  icon: LucideIcon;
  tone: string;
}

const STAT_CARDS: StatCard[] = [
  { chip: 'needs-action', label: 'Needs action', statuses: ['PROPOSED', 'NEEDS_MANUAL_REVIEW'], icon: Sparkles, tone: 'bg-ai-50 text-ai-700' },
  { chip: 'NEEDS_MANUAL_REVIEW', label: 'Manual review', statuses: ['NEEDS_MANUAL_REVIEW'], icon: TriangleAlert, tone: 'bg-warning-50 text-warning-700' },
  { chip: 'INVESTIGATING', label: 'AI working', statuses: ['OPEN', 'INVESTIGATING'], icon: LoaderCircle, tone: 'bg-info-50 text-info-700' },
  { chip: 'CLOSED', label: 'Closed', statuses: ['CLOSED'], icon: CircleCheck, tone: 'bg-success-50 text-success-700' },
];

/** Live counts per queue. Each card is also a filter shortcut, so the numbers are actionable. */
function QueueStats({ selected, onSelect }: { selected: ChipValue; onSelect: (chip: ChipValue) => void }) {
  return (
    <div role="group" aria-label="Queue summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STAT_CARDS.map((card) => (
        <StatButton key={card.chip} card={card} pressed={selected === card.chip} onSelect={onSelect} />
      ))}
    </div>
  );
}

function StatButton({ card, pressed, onSelect }: { card: StatCard; pressed: boolean; onSelect: (chip: ChipValue) => void }) {
  const total = useCases({ status: card.statuses, size: 1 }).data?.total;
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onSelect(card.chip)}
      className={cx(
        'flex items-center gap-3 rounded-2xl border bg-surface p-4 text-left shadow-sm transition-[border-color,transform,box-shadow] duration-200 ease-out active:scale-[0.98] [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-lg',
        pressed ? 'border-primary-600 ring-2 ring-primary-50' : 'border-border',
      )}
    >
      <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', card.tone)}>
        <card.icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span>
        <span className="tabular block text-2xl font-semibold leading-tight text-text">{total ?? '–'}</span>
        <span className="block text-small text-text-muted">{card.label}</span>
      </span>
    </button>
  );
}
