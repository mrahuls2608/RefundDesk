import { logger } from '../../common/logger.js';
import { metrics } from '../../metrics/metrics.js';
import type { CaseFacts, InvestigationResult } from './agent.types.js';
import { LlmError, type LlmClient, type LlmMessage, type LlmResponse } from './llm/types.js';
import { PROMPT_VERSION, buildMessages } from './prompt/promptBuilder.js';
import { validateProposal } from './proposalValidator.js';
import type { AgentTool, ToolScope } from './tools/agentTools.js';

export const AGENT_TEMPERATURE = 0.1;
const BACKOFF_MS = [1000, 2000, 4000] as const;

export interface AgentConfig {
  maxCallsPerCase: number;
  timeoutMs: number;
  /** Injected so tests don't wait for real backoff delays. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => Date;
}

class CallBudgetExhausted extends Error {}

/**
 * Runs the tool-calling loop for one case and returns a validated proposal draft or a failure.
 * Hard limits: at most `maxCallsPerCase` LLM requests in total (retries included), temperature 0.1.
 * It never throws for LLM problems: the caller turns failures into NEEDS_MANUAL_REVIEW.
 */
export function createAgentService(llm: LlmClient, tools: AgentTool[], config: AgentConfig) {
  const sleep = config.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const toolsByName = new Map(tools.map((t) => [t.definition.name, t]));
  const definitions = tools.map((t) => t.definition);

  async function investigate(facts: CaseFacts): Promise<InvestigationResult> {
    const scope: ToolScope = { userId: facts.userId, now: config.now?.() ?? new Date() };
    const messages = buildMessages(facts);
    let calls = 0;
    let retriedValidation = false;

    const callLlm = async (): Promise<LlmResponse> => {
      for (let attempt = 0; ; attempt++) {
        if (calls >= config.maxCallsPerCase) throw new CallBudgetExhausted();
        calls++;
        try {
          return await timedChat(llm, messages, definitions, config.timeoutMs);
        } catch (err) {
          if (!(err instanceof LlmError) || !err.retriable || calls >= config.maxCallsPerCase) throw err;
          logger.warn({ event: 'LLM_RETRY', caseId: facts.caseId, kind: err.kind, attempt }, 'Retrying LLM call');
          await sleep(BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]!);
        }
      }
    };

    try {
      while (true) {
        const response = await callLlm();
        if (response.toolCalls.length > 0) {
          messages.push({ role: 'assistant', content: response.content, toolCalls: response.toolCalls });
          for (const call of response.toolCalls) {
            messages.push({ role: 'tool', toolCallId: call.id, name: call.name, content: await runTool(call.name, call.arguments, scope) });
          }
          continue;
        }
        const outcome = validateProposal(response.content, facts.transaction.amountPaise);
        if (outcome.valid) {
          metrics.agentOutcomes.inc({ outcome: 'proposed' });
          return {
            ok: true,
            llmCalls: calls,
            proposal: { ...outcome.proposal, model: response.model, promptVersion: PROMPT_VERSION },
          };
        }
        if (retriedValidation) return fail(`Invalid proposal after retry: ${outcome.error}`, calls);
        retriedValidation = true;
        logger.warn({ event: 'AGENT_INVALID_OUTPUT', caseId: facts.caseId, error: outcome.error }, 'Retrying with feedback');
        messages.push({ role: 'assistant', content: response.content });
        messages.push({
          role: 'user',
          content: `Your previous answer was invalid: ${outcome.error}. Reply again with ONLY the JSON object described in the instructions.`,
        });
      }
    } catch (err) {
      if (err instanceof CallBudgetExhausted) return fail(`LLM call limit (${config.maxCallsPerCase}) reached`, calls);
      if (err instanceof LlmError) return fail(`LLM ${err.kind}: ${err.message}`, calls);
      return fail(`Agent error: ${(err as Error).message}`, calls);
    }
  }

  async function runTool(name: string, rawArgs: string, scope: ToolScope): Promise<string> {
    const tool = toolsByName.get(name);
    if (!tool) return JSON.stringify({ error: `Unknown tool ${name}` });
    try {
      return JSON.stringify(await tool.execute(rawArgs, scope));
    } catch (err) {
      return JSON.stringify({ error: `Invalid arguments for ${name}: ${(err as Error).message}` });
    }
  }

  return { investigate };
}

export type AgentService = ReturnType<typeof createAgentService>;

async function timedChat(llm: LlmClient, messages: LlmMessage[], tools: AgentTool['definition'][], timeoutMs: number) {
  const stopTimer = metrics.llmLatency.startTimer();
  try {
    const response = await llm.chat([...messages], tools, { temperature: AGENT_TEMPERATURE, timeoutMs });
    metrics.llmCalls.inc({ outcome: 'success' });
    logger.info(
      { event: 'LLM_CALL', provider: llm.provider, model: response.model, promptVersion: PROMPT_VERSION, usage: response.usage },
      'LLM call completed',
    );
    return response;
  } catch (err) {
    metrics.llmCalls.inc({ outcome: err instanceof LlmError ? err.kind.toLowerCase() : 'error' });
    throw err;
  } finally {
    stopTimer();
  }
}

function fail(reason: string, llmCalls: number): InvestigationResult {
  metrics.agentOutcomes.inc({ outcome: 'failed' });
  return { ok: false, reason, llmCalls };
}
