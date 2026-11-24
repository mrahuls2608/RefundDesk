import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/LegalPage';

export const metadata: Metadata = { title: 'Privacy · RefundDesk' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="24 November 2026">
      <p>RefundDesk is an open source demonstration. It runs on invented transactions and demo accounts only.</p>
      <h2>What we store</h2>
      <p>
        The demo stores the cases, notes and decisions you create while exploring it. Your login token lives in your browser session and is
        cleared when you log out or close the tab. Your theme choice is kept in local storage.
      </p>
      <h2>What we never store</h2>
      <p>No real names, card numbers, UPI ids or bank details. Please do not enter real personal or payment information.</p>
      <h2>AI providers</h2>
      <p>
        When a real model is configured, case facts are sent to that provider to produce a proposal. The default offline investigator sends
        nothing outside the server.
      </p>
    </LegalPage>
  );
}
