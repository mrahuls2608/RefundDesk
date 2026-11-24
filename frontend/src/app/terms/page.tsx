import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/LegalPage';

export const metadata: Metadata = { title: 'Terms · RefundDesk' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="24 November 2026">
      <p>RefundDesk is provided under the MIT License, as is, without warranty of any kind.</p>
      <h2>Demo use</h2>
      <p>
        The hosted demo moves no real money and may be reset at any time. Do not rely on it for real disputes or store anything you need to
        keep.
      </p>
      <h2>Your own deployment</h2>
      <p>
        If you run RefundDesk with real payment data, you are responsible for its security, compliance with local payment regulations and
        the AI provider terms you choose.
      </p>
    </LegalPage>
  );
}
