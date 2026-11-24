import { env } from '../../config/env.js';
import { createAgentService } from './agent.service.js';
import { createLlmClient } from './llm/llmClientFactory.js';
import { createAgentTools } from './tools/agentTools.js';
import { repositoryDataSource } from './tools/agentDataSource.js';

export type { CaseFacts, InvestigationResult, ProposalDraft } from './agent.types.js';
export type { AgentService } from './agent.service.js';

/** Production wiring: provider from env, read-only repository-backed tools. */
export function createDefaultAgentService() {
  return createAgentService(createLlmClient(), createAgentTools(repositoryDataSource), {
    maxCallsPerCase: env.LLM_MAX_CALLS_PER_CASE,
    timeoutMs: env.LLM_TIMEOUT_SECONDS * 1000,
  });
}
