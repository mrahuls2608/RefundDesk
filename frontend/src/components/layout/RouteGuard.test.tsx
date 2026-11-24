import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteGuard } from './RouteGuard';

const replace = vi.fn();
const auth = { ready: true, user: null as null | { id: number; name: string; role: 'CUSTOMER' | 'OPS' }, signingOut: false };

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }), usePathname: () => '/cases/1' }));
vi.mock('@/lib/auth/AuthProvider', () => ({ useAuth: () => auth, homeFor: (role: string) => (role === 'CUSTOMER' ? '/transactions' : '/ops') }));

describe('RouteGuard', () => {
  beforeEach(() => {
    replace.mockClear();
    auth.user = null;
    auth.signingOut = false;
  });

  it('sends a signed out visitor to login with a return path', () => {
    render(<RouteGuard roles={['CUSTOMER']}>secret</RouteGuard>);
    expect(replace).toHaveBeenCalledWith('/login?next=%2Fcases%2F1');
  });

  it('does not race the logout redirect or keep the previous user’s page as ?next=', () => {
    auth.signingOut = true;
    render(<RouteGuard roles={['CUSTOMER']}>secret</RouteGuard>);
    expect(replace).not.toHaveBeenCalled();
  });

  it('sends a user with the wrong role to their own home', () => {
    auth.user = { id: 3, name: 'Ravi', role: 'OPS' };
    render(<RouteGuard roles={['CUSTOMER']}>secret</RouteGuard>);
    expect(replace).toHaveBeenCalledWith('/ops');
  });
});
