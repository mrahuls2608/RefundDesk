'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { HexPattern } from '@/components/landing/HexPattern';
import { Logo } from '@/components/layout/Logo';
import { SkipLink } from '@/components/layout/SkipLink';
import { Banner, Button, Input, cx } from '@/components/ui';
import { ApiError } from '@/lib/api/http';
import { homeFor, useAuth } from '@/lib/auth/AuthProvider';
import { usePageTitle } from '@/lib/usePageTitle';

const LoginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type FieldErrors = Partial<Record<'email' | 'password', string>>;

/** Mock demo accounts (seed data). One click fills the form so visitors can explore every role. */
const DEMO_PASSWORD = 'Demo@123';
const DEMO_ACCOUNTS = [
  { email: 'asha@demo.in', name: 'Asha', role: 'Customer', hint: 'Report a charge' },
  { email: 'ravi@demo.in', name: 'Ravi', role: 'Ops agent', hint: 'Work the queue' },
  { email: 'priya@demo.in', name: 'Priya', role: 'Approver', hint: 'Approve refunds' },
  { email: 'admin@demo.in', name: 'Admin', role: 'Admin', hint: 'Users and policies' },
] as const;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const headingRef = usePageTitle('Log in');
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])) as FieldErrors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const user = await login(parsed.data.email, parsed.data.password);
      const next = params.get('next');
      router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : homeFor(user.role));
    } catch (err) {
      setFormError(loginErrorMessage(err));
      setSubmitting(false);
    }
  };

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setFieldErrors({});
    setFormError(null);
  };

  return (
    <>
      <SkipLink />
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="relative isolate hidden overflow-hidden bg-forest-900 p-12 text-forest-on lg:flex lg:flex-col lg:justify-between">
          <HexPattern className="-right-16 top-10 w-80" />
          <span aria-hidden="true" className="absolute -bottom-24 -left-24 -z-10 h-96 w-96 rounded-full bg-accent opacity-20 blur-3xl" />
          <Link href="/" aria-label="RefundDesk home" className="w-max rounded-md">
            <Logo tone="forest" />
          </Link>
          <div className="max-w-md">
            <p className="mb-4 text-4xl font-semibold leading-tight tracking-tight text-balance">
              The AI does the digging. <span className="text-accent">A person makes the call.</span>
            </p>
            <p className="text-lg text-forest-muted text-pretty">Every refund is paid exactly once, with a full audit trail behind it.</p>
          </div>
          <p className="text-sm text-forest-muted">Mock data only. No real payments, names or bank details.</p>
        </aside>
        <main id="main" className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Link href="/" aria-label="RefundDesk home" className="mb-8 inline-flex rounded-md lg:hidden">
              <Logo />
            </Link>
            <h1 ref={headingRef} tabIndex={-1} className="mb-1 text-3xl font-semibold tracking-tight outline-none">
              Welcome back
            </h1>
            <p className="mb-8 text-body text-text-muted">Log in to your RefundDesk account.</p>
            {params.get('reason') === 'expired' && (
              <Banner variant="info" className="mb-4">
                Please log in again.
              </Banner>
            )}
            {formError && (
              <Banner variant="danger" className="mb-4">
                {formError}
              </Banner>
            )}
            <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
              <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email} required />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
                required
              />
              <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
                Log in
              </Button>
            </form>
            <section aria-labelledby="demo-title" className="mt-10">
              <div className="mb-3 flex items-center gap-3">
                <h2 id="demo-title" className="text-sm font-semibold text-text">
                  Try a demo account
                </h2>
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => {
                  const selected = email === account.email;
                  return (
                    <li key={account.email}>
                      <button
                        type="button"
                        onClick={() => fillDemo(account)}
                        aria-pressed={selected}
                        className={cx(
                          'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.98]',
                          selected ? 'border-primary-600 bg-primary-50' : 'border-border bg-surface hover:border-border-strong',
                        )}
                      >
                        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-900 text-sm font-semibold text-accent">
                          {account.name[0]}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-text">{account.role}</span>
                          <span className="block truncate text-xs text-text-muted">{account.hint}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-text-muted">Fills the form with the account’s email and the shared demo password.</p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'RATE_LIMITED') return 'Too many attempts. Try again in a minute.';
    if (err.status === 401) return 'Email or password is incorrect.';
    return err.message;
  }
  return 'Something went wrong. Try again.';
}
