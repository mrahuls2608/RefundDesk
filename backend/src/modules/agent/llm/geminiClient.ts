import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { postJson } from './http.js';
import { LlmError, type ChatOptions, type LlmClient, type LlmMessage, type LlmResponse, type ToolDefinition } from './types.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const PartSchema = z.object({
  text: z.string().optional(),
  functionCall: z.object({ name: z.string(), args: z.record(z.string(), z.unknown()).optional() }).optional(),
});

const ResponseSchema = z.object({
  candidates: z.array(z.object({ content: z.object({ parts: z.array(PartSchema).default([]) }) })).min(1),
  usageMetadata: z.object({ promptTokenCount: z.number(), candidatesTokenCount: z.number().optional() }).optional(),
});

/** Gemini generateContent client with function calling. The key goes in a header, never the URL. */
export class GeminiClient implements LlmClient {
  readonly provider = 'gemini';

  constructor(
    readonly model: string,
    private readonly apiKey: string,
    private readonly baseUrl = GEMINI_BASE_URL,
  ) {}

  async chat(messages: LlmMessage[], tools: ToolDefinition[], options: ChatOptions): Promise<LlmResponse> {
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content ?? '').join('\n\n');
    const body = {
      ...(system && { systemInstruction: { parts: [{ text: system }] } }),
      contents: toContents(messages.filter((m) => m.role !== 'system')),
      generationConfig: { temperature: options.temperature },
      ...(tools.length > 0 && {
        tools: [{ functionDeclarations: tools.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters })) }],
      }),
    };
    const url = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent`;
    const raw = await postJson(url, body, { 'x-goog-api-key': this.apiKey }, options.timeoutMs);
    const parsed = ResponseSchema.safeParse(raw);
    if (!parsed.success) throw new LlmError('BAD_RESPONSE', 'Unexpected Gemini response shape');
    const parts = parsed.data.candidates[0]!.content.parts;
    const text = parts.map((p) => p.text ?? '').join('').trim();
    return {
      content: text || null,
      toolCalls: parts
        .filter((p) => p.functionCall)
        .map((p) => ({ id: randomUUID(), name: p.functionCall!.name, arguments: JSON.stringify(p.functionCall!.args ?? {}) })),
      model: this.model,
      usage: parsed.data.usageMetadata && {
        promptTokens: parsed.data.usageMetadata.promptTokenCount,
        completionTokens: parsed.data.usageMetadata.candidatesTokenCount ?? 0,
      },
    };
  }
}

function toContents(messages: LlmMessage[]): unknown[] {
  return messages.map((m) => {
    if (m.role === 'tool') {
      return { role: 'user', parts: [{ functionResponse: { name: m.name, response: { content: m.content } } }] };
    }
    if (m.role === 'assistant') {
      const calls = (m.toolCalls ?? []).map((c) => ({ functionCall: { name: c.name, args: safeJson(c.arguments) } }));
      return { role: 'model', parts: [...(m.content ? [{ text: m.content }] : []), ...calls] };
    }
    return { role: 'user', parts: [{ text: m.content ?? '' }] };
  });
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
