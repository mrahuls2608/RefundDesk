import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createAgentService } from '../../src/modules/agent/agent.service.js';
import { createLlmClient } from '../../src/modules/agent/llm/llmClientFactory.js';
import { createAgentTools } from '../../src/modules/agent/tools/agentTools.js';
import type { TransactionDoc } from '../../src/modules/transaction/transaction.model.js';
import { memoryDataSource } from '../support/fixtures.js';

/**
 * Agent accuracy on labelled cases (PRD §11). Uses whatever LLM_PROVIDER is configured, e.g.
 *   LLM_PROVIDER=groq LLM_API_KEY=... npm run test:eval -w backend
 * Target: >= 80% of proposals match the expected action. Record the score in README / PRs.
 */
const TARGET_ACCURACY = 0.8;
const NOW = new Date();

interface EvalTxn { id: number; amount: number; merchant: string; status: 'SUCCESS' | 'FAILED' | 'PENDING'; minutesAgo: number }
interface EvalCase { name: string; issueType: string; description: string; caseTransaction: EvalTxn; otherTransactions: EvalTxn[]; expectedAction: string }

const suite = JSON.parse(readFileSync(new URL('./agent-evals/cases.json', import.meta.url), 'utf8')) as { cases: EvalCase[] };

const toDoc = (t: EvalTxn): TransactionDoc => ({
  _id: t.id, userId: 1, amountPaise: Math.round(t.amount * 100), currency: 'INR', merchant: t.merchant, status: t.status,
  createdAt: new Date(NOW.getTime() - t.minutesAgo * 60_000),
});

describe('agent eval suite', () => {
  it(`matches the expected action on >= ${TARGET_ACCURACY * 100}% of ${suite.cases.length} cases`, async () => {
    const llm = createLlmClient();
    const rows: string[] = [];
    let correct = 0;
    for (const c of suite.cases) {
      const caseTxn = toDoc(c.caseTransaction);
      const agent = createAgentService(llm, createAgentTools(memoryDataSource([caseTxn, ...c.otherTransactions.map(toDoc)])), {
        maxCallsPerCase: 3, timeoutMs: 20_000, now: () => NOW,
      });
      const result = await agent.investigate({ caseId: 1, userId: 1, issueType: c.issueType, description: c.description, transaction: caseTxn });
      const actual = result.ok ? result.proposal.action : `FAILED (${result.reason})`;
      const pass = actual === c.expectedAction;
      if (pass) correct++;
      rows.push(`${pass ? 'PASS' : 'FAIL'}  ${c.name.padEnd(28)} expected=${c.expectedAction.padEnd(12)} actual=${actual}`);
    }
    const accuracy = correct / suite.cases.length;
    process.stdout.write(`\nAgent eval (${llm.provider}/${llm.model}): ${correct}/${suite.cases.length} = ${(accuracy * 100).toFixed(1)}%\n${rows.join('\n')}\n`);
    expect(accuracy).toBeGreaterThanOrEqual(TARGET_ACCURACY);
  });
});
