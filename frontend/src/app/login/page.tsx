'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Logo } from '@/components/layout/Logo';
import { SkipLink } from '@/components/layout/SkipLink';
import { Banner, Button, Input } from '@/components/ui';
import { ApiError } from '@/lib/api/http';
import { homeFor, useAuth } from '@/lib/auth/AuthProvider';
import { usePageTitle } from '@/lib/usePageTitle';

const LoginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type FieldErrors = Partial<Record<'email' | 'password', string>>;

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

  return (
    <>
      <SkipLink />
      <main id="main" className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 ref={headingRef} tabIndex={-1} className="mb-4 text-center text-h1 outline-none">
            Log in
          </h1>
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
          <p className="mt-4 text-center text-small text-text-muted">Demo accounts: see README</p>
        </div>
      </main>
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
