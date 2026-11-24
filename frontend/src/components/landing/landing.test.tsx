import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/test/axe';
import { Faq } from './Faq';
import { IdempotencyDemo } from './IdempotencyDemo';
import { LandingNav } from './LandingNav';

vi.mock('@/lib/auth/AuthProvider', () => ({
  useAuth: () => ({ user: null, ready: true }),
  homeFor: () => '/transactions',
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('IdempotencyDemo', () => {
  it('never creates more than one refund however many times approve is clicked', async () => {
    const { container } = render(<IdempotencyDemo />);
    const approve = screen.getByRole('button', { name: 'Approve refund' });
    for (let i = 0; i < 7; i++) await userEvent.click(approve);
    expect(screen.getByText('Approve clicks').nextSibling).toHaveTextContent('7');
    expect(screen.getByText('Refunds created').nextSibling).toHaveTextContent('1');
    expect(screen.getAllByText('409')).toHaveLength(4); // log keeps the latest 5: four 409s and the original 200
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('resets back to zero', async () => {
    render(<IdempotencyDemo />);
    await userEvent.click(screen.getByRole('button', { name: 'Approve refund' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText('Refunds created').nextSibling).toHaveTextContent('0');
    expect(screen.getByText('Responses appear here.')).toBeInTheDocument();
  });
});

describe('LandingNav', () => {
  it('opens the mobile menu, moves focus into it and closes on Escape', async () => {
    const { container } = render(<LandingNav />);
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Menu' })).not.toHaveAttribute('inert');
    expect(document.activeElement?.textContent).toBe('How it works');
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
  });

  it('points the call to action at the demo login for visitors', () => {
    render(<LandingNav />);
    expect(screen.getAllByRole('link', { name: 'Try the demo' })[0]).toHaveAttribute('href', '/login');
  });
});

describe('Faq', () => {
  it('uses native disclosure widgets and has no axe violations', async () => {
    const { container } = render(<Faq />);
    const question = screen.getByText('Can the AI approve a refund on its own?');
    await userEvent.click(question);
    expect(question.closest('details')).toHaveAttribute('open');
    expect(await axeViolations(container)).toEqual([]);
  });
});
