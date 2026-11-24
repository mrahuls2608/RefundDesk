import type { ChatOptions, LlmClient, LlmMessage, LlmResponse, ToolDefinition } from './types.js';

/**
 * Deterministic, offline stand-in for a real model (LLM_PROVIDER=mock). It follows the same
 * protocol as a real model: first asks for tools, then answers with proposal JSON. This keeps
 * the demo and local development working with no API key. It is a heuristic, not an AI, and
 * labels its proposals with model "mock-heuristic-v1".
 */
export const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

interface CaseTxn {
  id: number;
  amount: number;
  merchant: string;
  status: string;
  createdAt: string;
}

interface CaseData {
  issueType: string;
  transaction: CaseTxn;
}

export class MockLlmClient implements LlmClient {
  readonly provider = 'mock';
  readonly model = 'mock-heuristic-v1';

  async chat(messages: LlmMessage[], _tools: ToolDefinition[], _options: ChatOptions): Promise<LlmResponse> {
    const caseData = readCaseData(messages);
    const toolResults = messages.filter((m) => m.role === 'tool');
    if (toolResults.length === 0) {
      return {
        content: null,
        model: this.model,
        toolCalls: [
          { id: 'mock-1', name: 'getTransactions', arguments: JSON.stringify({ days: 30 }) },
          { id: 'mock-2', name: 'getPolicy', arguments: JSON.stringify({ issueType: caseData.issueType }) },
        ],
      };
    }
    const history = readTransactions(toolResults);
    return { content: JSON.stringify(decide(caseData, history)), toolCalls: [], model: this.model };
  }
}

function decide(caseData: CaseData, history: CaseTxn[]) {
  const txn = caseData.transaction;
  switch (caseData.issueType) {
    case 'DUPLICATE_CHARGE': {
      const twin = history.find(
        (other) =>
          other.id !== txn.id &&
          other.merchant === txn.merchant &&
          other.amount === txn.amount &&
          other.status === 'SUCCESS' &&
          Math.abs(Date.parse(other.createdAt) - Date.parse(txn.createdAt)) <= DUPLICATE_WINDOW_MS,
      );
      if (twin) {
        const seconds = Math.round(Math.abs(Date.parse(txn.createdAt) - Date.parse(twin.createdAt)) / 1000);
        return proposal('FULL_REFUND', txn.amount, 0.92, [
          `Identical ₹${txn.amount.toFixed(2)} charge to ${txn.merchant} ${seconds} seconds apart (txn ${twin.id})`,
          'Policy allows a full refund of the duplicate charge',
        ]);
      }
      return proposal('REJECT', 0, 0.7, ['No matching charge to the same merchant within 10 minutes was found']);
    }
    case 'FAILED_BUT_DEBITED':
      if (txn.status === 'FAILED') {
        return proposal('FULL_REFUND', txn.amount, 0.88, [
          `Transaction ${txn.id} is recorded as FAILED but the customer reports a debit`,
          'Policy allows a full refund for failed-but-debited payments',
        ]);
      }
      return proposal('REJECT', 0, 0.65, [`Transaction ${txn.id} completed with status ${txn.status}`]);
    default:
      return proposal('REJECT', 0, 0.4, [
        'The issue cannot be verified from transaction data alone; a human should review the customer message',
      ]);
  }
}

function proposal(action: string, amount: number, confidence: number, reasons: string[]) {
  return { action, amount, confidence, reasons };
}

function readCaseData(messages: LlmMessage[]): CaseData {
  const user = messages.find((m) => m.role === 'user' && m.content?.includes('<case_data>'));
  const match = user?.content?.match(/<case_data>([\s\S]*?)<\/case_data>/);
  if (!match) throw new Error('mock LLM: no case data in prompt');
  return JSON.parse(match[1]!) as CaseData;
}

function readTransactions(toolResults: LlmMessage[]): CaseTxn[] {
  for (const result of toolResults) {
    const parsed = JSON.parse(result.content ?? '{}') as { transactions?: CaseTxn[] };
    if (parsed.transactions) return parsed.transactions;
  }
  return [];
}
