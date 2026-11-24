import type { ChatOptions, LlmClient, LlmMessage, LlmResponse, ToolDefinition } from '../../src/modules/agent/llm/types.js';

export type ScriptStep = LlmResponse | Error | ((messages: LlmMessage[]) => LlmResponse);

/** Scripted LLM for unit tests: returns (or throws) the next step on every call and records calls. */
export class FakeLlmClient implements LlmClient {
  readonly provider = 'fake';
  readonly model = 'fake-model';
  readonly calls: { messages: LlmMessage[]; tools: ToolDefinition[]; options: ChatOptions }[] = [];

  constructor(private readonly script: ScriptStep[]) {}

  async chat(messages: LlmMessage[], tools: ToolDefinition[], options: ChatOptions): Promise<LlmResponse> {
    this.calls.push({ messages: structuredClone(messages), tools, options });
    const step = this.script[this.calls.length - 1];
    if (!step) throw new Error('FakeLlmClient: script exhausted');
    if (step instanceof Error) throw step;
    return typeof step === 'function' ? step(messages) : step;
  }
}

export const toolCall = (id: string, name: string, args: unknown): LlmResponse => ({
  content: null,
  model: 'fake-model',
  toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
});

export const answer = (content: unknown): LlmResponse => ({
  content: typeof content === 'string' ? content : JSON.stringify(content),
  model: 'fake-model',
  toolCalls: [],
});
