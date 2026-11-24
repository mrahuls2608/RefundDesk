import type { Metadata } from 'next';
import { SkipLink } from '@/components/layout/SkipLink';
import { Faq, FAQ } from '@/components/landing/Faq';
import { DemoVideo } from '@/components/landing/DemoVideo';
import { FinalCta } from '@/components/landing/FinalCta';
import { Guarantees } from '@/components/landing/Guarantees';
import { Hero } from '@/components/landing/Hero';
import { HubSection } from '@/components/landing/HubSection';
import { IdempotencyDemo } from '@/components/landing/IdempotencyDemo';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingNav } from '@/components/landing/LandingNav';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { ProcessLine } from '@/components/landing/ProcessLine';
import { RoleCards } from '@/components/landing/RoleCards';
import { TaglineReveal } from '@/components/landing/TaglineReveal';

export const metadata: Metadata = {
  title: 'RefundDesk · AI refund desk with human approval',
  description:
    'Resolve payment disputes in minutes. An AI agent investigates and proposes, a person approves, and every refund is paid exactly once with a full audit trail.',
  openGraph: {
    title: 'RefundDesk · AI refund desk with human approval',
    description: 'AI investigates, humans approve, money moves once.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

/** FAQ in schema.org form so answer engines can quote it (AEO). */
const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
};

export default function LandingPage() {
  return (
    <>
      <SkipLink />
      <LandingNav />
      <main id="main" className="overflow-x-clip">
        <Hero />
        <ProblemSection />
        <HubSection />
        <RoleCards />
        <DemoVideo />
        <Guarantees />
        <ProcessLine />
        <TaglineReveal />
        <IdempotencyDemo />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
    </>
  );
}
