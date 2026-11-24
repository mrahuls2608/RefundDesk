import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createAgentService } from '../../src/modules/agent/agent.service.js';
import { LlmError } from '../../src/modules/agent/llm/types.js';
import { createAgentTools } from '../../src/modules/agent/tools/agentTools.js';
import { repositoryDataSource } from '../../src/modules/agent/tools/agentDataSource.js';
import { RefundModel } from '../../src/modules/refund/refund.model.js';
import { FakeLlmClient } from '../support/fakeLlmClient.js';
import { bearer, buildApp, tokensFor, waitForStatus, type Persona } from './helpers.js';

/** LLM outage: every call times out. The case must land in manual review and the app keep working. */
const outage = new FakeLlmClient(Array.from({ length: 50 }, () => new LlmError('TIMEOUT', 'timed out')));
const agent = createAgentService(outage, createAgentTools(repositoryDataSource), {
  maxCallsPerCase: 3,
  timeoutMs: 1000,
  sleep: async () => undefined,
});
const app = buildApp(agent);
let tokens: Record<Persona, string>;

beforeAll(async () => {
  tokens = await tokensFor(app);
});

describe('agent failure path', () => {
  it('moves the case to NEEDS_MANUAL_REVIEW with an AGENT_FAILED audit entry', async () => {
    const created = await request(app).post('/api/cases').set(bearer(tokens.customer)).send({ transactionId: 101, issueType: 'DUPLICATE_CHARGE' });
    const caseId = created.body.id as number;
    const detail = await waitForStatus(app, tokens.ops, caseId, ['NEEDS_MANUAL_REVIEW', 'PROPOSED']);
    expect(detail.status).toBe('NEEDS_MANUAL_REVIEW');
    expect(detail.proposal).toBeNull();
    const audit = await request(app).get(`/api/cases/${caseId}/audit`).set(bearer(tokens.ops));
    const failed = audit.body.find((e: { action: string }) => e.action === 'AGENT_FAILED');
    expect(failed).toMatchObject({ actor: 'AI agent', from: 'INVESTIGATING', to: 'NEEDS_MANUAL_REVIEW' });
    expect(failed.details.llmCalls).toBe(3);
    expect(await RefundModel.countDocuments({ caseId })).toBe(0);

    // Ops writes a manual proposal and the approver decides as normal.
    const manual = await request(app)
      .put(`/api/cases/${caseId}/proposal`)
      .set(bearer(tokens.ops))
      .send({ action: 'FULL_REFUND', amount: 499, reasons: ['Duplicate verified manually'] });
    expect(manual.status).toBe(200);
    const proposed = await request(app).get(`/api/cases/${caseId}`).set(bearer(tokens.approver));
    expect(proposed.body.status).toBe('PROPOSED');
  });

  it('lets ops re-run the agent (202) on a manual-review case', async () => {
    const created = await request(app).post('/api/cases').set(bearer(tokens.customer)).send({ transactionId: 104, issueType: 'DUPLICATE_CHARGE' });
    const caseId = created.body.id as number;
    await waitForStatus(app, tokens.ops, caseId, ['NEEDS_MANUAL_REVIEW']);
    const rerun = await request(app).post(`/api/cases/${caseId}/rerun-agent`).set(bearer(tokens.ops));
    expect(rerun.status).toBe(202);
    expect(rerun.body).toEqual({ status: 'INVESTIGATING' });
    await waitForStatus(app, tokens.ops, caseId, ['NEEDS_MANUAL_REVIEW']);
  });
});
