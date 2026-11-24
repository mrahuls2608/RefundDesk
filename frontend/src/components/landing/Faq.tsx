import { Plus } from 'lucide-react';
import { Reveal } from './Reveal';

export const FAQ = [
  {
    q: 'Can the AI approve a refund on its own?',
    a: 'No. The agent can only read transactions and policy rules. It returns a proposal, and only an approver can turn a proposal into a refund. An automated architecture test fails the build if agent code ever imports refund code.',
  },
  {
    q: 'What happens when the AI is down or gets it wrong?',
    a: 'Timeouts, rate limits and invalid answers move the case to manual review after at most 3 model calls. Ops can write the proposal themselves or rerun the AI, and the approver always sees the reasons and confidence before deciding.',
  },
  {
    q: 'How do you stop a refund from being paid twice?',
    a: 'Three layers. The decision checks the case version, so a second click gets a conflict. Each case allows one decision. The refund itself is keyed to the case and backed by a unique database index, so even a retry returns the original refund.',
  },
  {
    q: 'Which AI models does it work with?',
    a: 'Groq (Llama), Google Gemini and local models through Ollama, all behind one interface. A built in offline investigator lets you run the full flow with no API key.',
  },
  {
    q: 'What does the customer see?',
    a: 'A calm, four step status: received, in review, decision and refunded. Customers never see the AI reasoning, confidence or internal notes. Ops and approvers see all of it.',
  },
  {
    q: 'Can I audit who decided what?',
    a: 'Yes. Every status change writes an entry with the actor, action, previous and new status and time, in the same database transaction as the change. Entries cannot be edited or deleted.',
  },
  {
    q: 'Is it connected to a real payment gateway?',
    a: 'Not yet. RefundDesk is an open source reference build that runs on mock transactions only, so you can explore it safely. The refund service is a single module, ready to call a real provider.',
  },
  {
    q: 'How do I run it myself?',
    a: 'Clone the repository, copy the example environment file, run docker compose up and seed the demo data. The README walks through it in five commands.',
  },
] as const;

/** Native details and summary: keyboard and screen reader support for free. Opening animates, closing is instant. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-24 sm:px-6">
      <Reveal className="mb-12">
        <p className="mb-3 text-sm font-semibold text-primary-600">FAQ</p>
        <h2 id="faq-title" className="text-3xl font-semibold tracking-tight text-text text-balance sm:text-4xl">
          Questions teams ask before they trust it
        </h2>
      </Reveal>
      <div className="flex flex-col gap-3">
        {FAQ.map((item, index) => (
          <Reveal key={item.q} delay={index * 40}>
            <details className="group rounded-2xl border border-border bg-surface px-6 py-4 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-text [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus aria-hidden="true" className="h-5 w-5 shrink-0 text-text-muted transition-transform duration-300 ease-out group-open:rotate-45" />
              </summary>
              <p className="animate-fade-up pt-3 text-base text-text-muted text-pretty">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
