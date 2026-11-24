'use client';

import { useState } from 'react';
import { Avatar, SkeletonList, StatusTimeline, Tabs } from '@/components/ui';
import { useAudit } from '@/lib/api/hooks';
import type { CaseDetail } from '@/lib/api/types';
import { formatDateTime } from '@/lib/format';
import { AUDIT_ACTION_LABEL, STATUS_LABEL } from '@/lib/labels';
import { PageError } from '../layout/PageError';

export function ActivityTabs({ detail }: { detail: CaseDetail }) {
  const [tab, setTab] = useState<'timeline' | 'audit'>('timeline');
  return (
    <Tabs
      label="Case activity"
      value={tab}
      onChange={setTab}
      tabs={[
        {
          value: 'timeline',
          label: 'Timeline',
          content: (
            <StatusTimeline
              label="Status history"
              steps={[...detail.timeline].reverse().map((entry, index) => ({
                key: `${entry.status}-${entry.at}`,
                label: STATUS_LABEL[entry.status],
                at: entry.at,
                actor: entry.actor,
                state: index === 0 ? 'current' : 'done',
              }))}
            />
          ),
        },
        { value: 'audit', label: 'Audit log', content: <AuditLog caseId={detail.id} /> },
      ]}
    />
  );
}

function AuditLog({ caseId }: { caseId: number }) {
  const audit = useAudit(caseId);
  if (audit.isPending) return <SkeletonList rows={3} label="Loading audit log" />;
  if (audit.isError) return <PageError error={audit.error} onRetry={() => audit.refetch()} showTraceId />;
  return (
    <ol className="flex flex-col gap-3">
      {[...audit.data].reverse().map((entry) => (
        <li key={entry.id} className="flex gap-2">
          <Avatar name={entry.actor} />
          <div className="min-w-0">
            <p className="text-body">
              <span className="font-semibold">{AUDIT_ACTION_LABEL[entry.action] ?? entry.action}</span> by {entry.actor}
            </p>
            <p className="text-small text-text-muted">
              <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
              {entry.from && entry.to && entry.from !== entry.to && (
                <>
                  {' '}· {STATUS_LABEL[entry.from]} → {STATUS_LABEL[entry.to]}
                </>
              )}
            </p>
            {entry.details && typeof entry.details.reason === 'string' && <p className="text-small text-text-muted">{entry.details.reason}</p>}
            {entry.details && typeof entry.details.comment === 'string' && <p className="text-small">“{entry.details.comment}”</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
