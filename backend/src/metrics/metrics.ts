import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

/** Micrometer-equivalent business metrics (TRD §10), exposed at /actuator/prometheus. */
export const registry = new Registry();
collectDefaultMetrics({ register: registry, prefix: 'refunddesk_process_' });

export const metrics = {
  casesCreated: new Counter({ name: 'refunddesk_cases_created_total', help: 'Cases created', registers: [registry] }),
  proposalsCreated: new Counter({
    name: 'refunddesk_proposals_created_total', help: 'Proposals by source', labelNames: ['source'], registers: [registry],
  }),
  decisions: new Counter({
    name: 'refunddesk_decisions_total', help: 'Approver decisions', labelNames: ['decision'], registers: [registry],
  }),
  refunds: new Counter({
    name: 'refunddesk_refunds_total', help: 'Refund executions', labelNames: ['status'], registers: [registry],
  }),
  llmCalls: new Counter({
    name: 'refunddesk_llm_calls_total', help: 'LLM calls by outcome', labelNames: ['outcome'], registers: [registry],
  }),
  llmLatency: new Histogram({
    name: 'refunddesk_llm_latency_seconds', help: 'LLM call latency', buckets: [0.5, 1, 2, 5, 10, 20], registers: [registry],
  }),
  agentAgreement: new Counter({
    name: 'refunddesk_agent_agreement_total', help: 'Approver agreed with AI proposal', labelNames: ['agreed'], registers: [registry],
  }),
  agentOutcomes: new Counter({
    name: 'refunddesk_agent_outcomes_total', help: 'Agent investigation outcomes', labelNames: ['outcome'], registers: [registry],
  }),
};
