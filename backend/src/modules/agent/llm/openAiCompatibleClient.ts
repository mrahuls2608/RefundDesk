import { z } from 'zod';
import { postJson } from './http.js';
import { LlmError, type ChatOptions, type LlmClient, type LlmMessage, type LlmResponse, type ToolDefinition } from './types.js';

const ResponseSchema = z.object({
  model: z.string().optional(),
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable().optional(),
          tool_calls: z
            .array(z.object({ id: z.string(), function: z.object({ name: z.string(), arguments: z.string() }) }))
            .optional(),
        }),
      }),
    )
    .min(1),
  usage: z.object({ prompt_tokens: z.number(), completion_tokens: z.number() }).optional(),
});

/** Chat-completions client for any OpenAI-compatible API: Groq (default) and Ollama. */
export class OpenAiCompatibleClient implements LlmClient {
  constructor(
    readonly provider: string,
    readonly model: string,
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async chat(messages: LlmMessage[], tools: ToolDefinition[], options: ChatOptions): Promise<LlmResponse> {
    const body = {
      model: this.model,
      temperature: options.temperature,
      messages: messages.map(toWireMessage),
      ...(tools.length > 0 && {
        tools: tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } })),
        tool_choice: 'auto',
      }),
    };
    const headers: Record<string, string> = this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {};
    const raw = await postJson(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, body, headers, options.timeoutMs);
    const parsed = ResponseSchema.safeParse(raw);
    if (!parsed.success) throw new LlmError('BAD_RESPONSE', 'Unexpected chat completion shape');
    const message = parsed.data.choices[0]!.message;
    return {
      content: message.content ?? null,
      toolCalls: (message.tool_calls ?? []).map((c) => ({ id: c.id, name: c.function.name, arguments: c.function.arguments })),
      model: parsed.data.model ?? this.model,
      usage: parsed.data.usage && {
        promptTokens: parsed.data.usage.prompt_tokens,
        completionTokens: parsed.data.usage.completion_tokens,
      },
    };
  }
}

function toWireMessage(message: LlmMessage): Record<string, unknown> {
  if (message.role === 'tool') {
    return { role: 'tool', tool_call_id: message.toolCallId, content: message.content ?? '' };
  }
  if (message.role === 'assistant' && message.toolCalls?.length) {
    return {
      role: 'assistant',
      content: message.content,
      tool_calls: message.toolCalls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: c.arguments } })),
    };
  }
  return { role: message.role, content: message.content ?? '' };
}
