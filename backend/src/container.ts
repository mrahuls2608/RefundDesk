import { env } from './config/env.js';
import { createDefaultAgentService, type AgentService } from './modules/agent/index.js';
import { createCaseService } from './modules/casemgmt/case.service.js';
import { createInvestigationService } from './modules/casemgmt/investigation.service.js';
import {
  createInlineDispatcher,
  createQueueDispatcher,
  type InvestigationDispatcher,
} from './modules/casemgmt/investigationDispatcher.js';

export type DispatchMode = 'queue' | 'inline';

/** Composition root: the only place that wires modules together. */
export function createContainer(options: { agent?: AgentService; dispatch?: DispatchMode } = {}) {
  const agent = options.agent ?? createDefaultAgentService();
  const investigations = createInvestigationService(agent);
  const runInProcess = (caseId: number, runId: string) => investigations.run(caseId, runId);
  const dispatcher: InvestigationDispatcher =
    (options.dispatch ?? 'queue') === 'inline' ? createInlineDispatcher(runInProcess) : createQueueDispatcher(runInProcess);
  const caseService = createCaseService(dispatcher);
  return { env, agent, investigations, caseService };
}
