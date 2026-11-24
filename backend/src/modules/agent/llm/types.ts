export type LlmRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id: string;
  name: string;
  /** Raw JSON arguments as produced by the model; parsed and validated by the tool. */
  arguments: string;
}

export interface LlmMessage {
  role: LlmRole;
  content: string | null;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the tool arguments. */
  parameters: Record<string, unknown>;
}

export interface LlmResponse {
  content: string | null;
  toolCalls: ToolCall[];
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface ChatOptions {
  temperature: number;
  timeoutMs: number;
}

/** Every LLM provider sits behind this interface; nothing else may talk to a provider directly. */
export interface LlmClient {
  readonly provider: string;
  readonly model: string;
  chat(messages: LlmMessage[], tools: ToolDefinition[], options: ChatOptions): Promise<LlmResponse>;
}

export type LlmErrorKind = 'RATE_LIMITED' | 'TIMEOUT' | 'SERVER' | 'BAD_RESPONSE' | 'CONFIG';

export class LlmError extends Error {
  constructor(
    readonly kind: LlmErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'LlmError';
  }

  get retriable(): boolean {
    return this.kind === 'RATE_LIMITED' || this.kind === 'TIMEOUT' || this.kind === 'SERVER';
  }
}
