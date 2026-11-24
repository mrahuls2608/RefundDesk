import { describe, expect, it } from 'vitest';
import { createAgentService } from '../../src/modules/agent/agent.service.js';
import { MockLlmClient } from '../../src/modules/agent/llm/mockLlmClient.js';
import { createAgentTools } from '../../src/modules/agent/tools/agentTools.js';
import { NOW, facts, memoryDataSource, txn } from '../support/fixtures.js';

const caseTxn = txn();

function investigate(transactions = [caseTxn], overrides = {}) {
  const service = createAgentService(new MockLlmClient(), createAgentTools(memoryDataSource(transactions)), {
    maxCallsPerCase: 3,
    timeoutMs: 1000,
    now: () => NOW,
  });
  return service.investigate(facts({ transaction: transactions[0]!, ...overrides }));
}

describe('MockLlmClient (offline investigator)', () => {
  it('proposes a full refund for a duplicate within 10 minutes', async () => {
    const twin = txn({ _id: 100, createdAt: new Date(caseTxn.createdAt.getTime() - 40_000) });
    const result = await investigate([caseTxn, twin]);
    expect(result).toMatchObject({ ok: true, proposal: { action: 'FULL_REFUND', amountPaise: 49900, model: 'mock-heuristic-v1' } });
  });

  it('rejects a duplicate claim with no matching charge', async () => {
    const result = await investigate([caseTxn]);
    expect(result).toMatchObject({ ok: true, proposal: { action: 'REJECT', amountPaise: 0 } });
  });

  it('refunds a FAILED transaction reported as debited', async () => {
    const failed = txn({ status: 'FAILED', amountPaise: 120000 });
    const result = await investigate([failed], { issueType: 'FAILED_BUT_DEBITED' });
    expect(result).toMatchObject({ ok: true, proposal: { action: 'FULL_REFUND', amountPaise: 120000 } });
  });

  it('uses low confidence when facts are insufficient', async () => {
    const result = await investigate([caseTxn], { issueType: 'WRONG_AMOUNT' });
    expect(result.ok && result.proposal.confidence).toBeLessThan(0.5);
  });
});
