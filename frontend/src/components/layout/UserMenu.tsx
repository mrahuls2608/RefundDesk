'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ThemeToggle } from './ThemeToggle';

const ROLE_LABEL = { CUSTOMER: 'Customer', OPS: 'Ops agent', APPROVER: 'Approver', ADMIN: 'Admin' } as const;

export function UserMenu({ showRole = false }: { showRole?: boolean }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="flex items-center gap-1">
      <span className="hidden text-small text-text-muted sm:inline">{user.name}</span>
      {showRole && <span className="rounded-full bg-primary-50 px-2 py-0.5 text-caption text-primary-700">{ROLE_LABEL[user.role]}</span>}
      <ThemeToggle />
      <button
        type="button"
        onClick={logout}
        className="inline-flex min-h-touch items-center gap-1 rounded-md px-2 text-small text-text-muted hover:bg-primary-50 hover:text-text"
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
        Log out
      </button>
    </div>
  );
}
