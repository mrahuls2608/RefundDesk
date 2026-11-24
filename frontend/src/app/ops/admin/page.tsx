'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { PageError } from '@/components/layout/PageError';
import { Banner, Button, Card, Input, Select, SkeletonList, Table, Tabs, Td, Textarea, Th, useToast } from '@/components/ui';
import { useAdminUsers, useCreateUser, usePolicies, useUpdatePolicy } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/http';
import type { PolicyRule, Role } from '@/lib/api/types';
import { ISSUE_LABEL } from '@/lib/labels';
import { usePageTitle } from '@/lib/usePageTitle';

const ADMIN_ONLY = ['ADMIN'] as const;
const ROLES: Role[] = ['CUSTOMER', 'OPS', 'APPROVER', 'ADMIN'];

export default function AdminPage() {
  return (
    <RouteGuard roles={ADMIN_ONLY}>
      <AdminContent />
    </RouteGuard>
  );
}

function AdminContent() {
  const headingRef = usePageTitle('Admin');
  const [tab, setTab] = useState<'users' | 'policies'>('users');
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-h1 outline-none">
        Admin
      </h1>
      <Tabs
        label="Admin sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'users', label: 'Users', content: <UsersTab /> },
          { value: 'policies', label: 'Policies', content: <PoliciesTab /> },
        ]}
      />
    </>
  );
}

const NewUserSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(100),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  role: z.enum(ROLES as [Role, ...Role[]]),
});

function UsersTab() {
  const users = useAdminUsers();
  const createUser = useCreateUser();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'OPS' as Role });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = NewUserSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    createUser.mutate(parsed.data, {
      onSuccess: () => {
        toast.show('User added');
        setForm({ name: '', email: '', password: '', role: 'OPS' });
      },
      onError: (err) => err instanceof ApiError && err.fields && setErrors(err.fields),
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        {users.isPending && <SkeletonList rows={3} label="Loading users" />}
        {users.isError && <PageError error={users.error} onRetry={() => users.refetch()} showTraceId />}
        {users.data && (
          <Table caption="Users">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((u) => (
                <tr key={u.id}>
                  <Td>{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.role}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      <Card title="Add user">
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
          {createUser.isError && !(createUser.error instanceof ApiError && createUser.error.fields) && <Banner variant="danger">Could not add the user.</Banner>}
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required />
          <Input
            label="Temporary password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            required
          />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} options={ROLES.map((r) => ({ value: r, label: r }))} />
          <Button type="submit" variant="primary" loading={createUser.isPending}>
            Add user
          </Button>
        </form>
      </Card>
    </div>
  );
}

function PoliciesTab() {
  const policies = usePolicies();
  if (policies.isPending) return <SkeletonList rows={4} label="Loading policies" />;
  if (policies.isError) return <PageError error={policies.error} onRetry={() => policies.refetch()} showTraceId />;
  return (
    <ul className="flex flex-col gap-4">
      {policies.data.map((rule) => (
        <li key={rule.id}>
          <PolicyForm rule={rule} />
        </li>
      ))}
    </ul>
  );
}

function PolicyForm({ rule }: { rule: PolicyRule }) {
  const update = useUpdatePolicy();
  const toast = useToast();
  const [ruleText, setRuleText] = useState(rule.ruleText);
  const [maxDays, setMaxDays] = useState(rule.maxDays?.toString() ?? '');
  const [active, setActive] = useState(rule.active);
  const [error, setError] = useState<string>();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!ruleText.trim()) return setError('Rule text is required');
    if (maxDays && !/^\d+$/.test(maxDays)) return setError('Max days must be a whole number');
    setError(undefined);
    update.mutate(
      { id: rule.id, ruleText: ruleText.trim(), maxDays: maxDays ? Number(maxDays) : null, active },
      { onSuccess: () => toast.show('Policy saved') },
    );
  };

  return (
    <Card title={ISSUE_LABEL[rule.issueType]}>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
        {update.isError && <Banner variant="danger">Could not save this policy.</Banner>}
        <Textarea label="Rule text" value={ruleText} onChange={(e) => setRuleText(e.target.value)} maxLength={1000} error={error} rows={3} required />
        <div className="flex flex-wrap items-end gap-4">
          <Input label="Max days" inputMode="numeric" className="w-32" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} />
          <label className="flex min-h-touch items-center gap-2 text-body">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-primary-600" />
            Active
          </label>
          <Button type="submit" loading={update.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Card>
  );
}
