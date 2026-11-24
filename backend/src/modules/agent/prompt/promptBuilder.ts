import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { LlmMessage } from '../llm/types.js';
import { toToolTransaction } from '../tools/agentTools.js';
import type { CaseFacts } from '../agent.types.js';

export const PROMPT_VERSION = 'v1';
const PROMPT_FILE = `refund-investigator-${PROMPT_VERSION}.txt`;

/** Resolves to backend/resources/prompts from both src/ (tsx) and dist/ (compiled). */
const PROMPTS_DIR = new URL('../../../../resources/prompts/', import.meta.url);

let cachedSystemPrompt: string | undefined;

export function loadSystemPrompt(): string {
  cachedSystemPrompt ??= readFileSync(fileURLToPath(new URL(PROMPT_FILE, PROMPTS_DIR)), 'utf8');
  return cachedSystemPrompt;
}

/**
 * Builds the conversation. Customer text is placed inside <case_data> as JSON; any attempt to
 * close the delimiter early is neutralised so the description can never escape the data block.
 */
export function buildMessages(facts: CaseFacts): LlmMessage[] {
  const caseData = {
    caseId: facts.caseId,
    issueType: facts.issueType,
    description: facts.description ?? '',
    transaction: toToolTransaction(facts.transaction),
  };
  const json = JSON.stringify(caseData).replace(/<\/?case_data>/gi, '[removed]');
  return [
    { role: 'system', content: loadSystemPrompt() },
    {
      role: 'user',
      content: `Investigate this case and propose a resolution.\n<case_data>${json}</case_data>`,
    },
  ];
}
