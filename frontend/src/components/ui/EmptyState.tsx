import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border bg-surface px-6 py-10 text-center">
      <Icon aria-hidden="true" className="h-6 w-6 text-text-muted" />
      <p className="text-h3">{title}</p>
      {description && <p className="text-body text-text-muted">{description}</p>}
      {action}
    </div>
  );
}
