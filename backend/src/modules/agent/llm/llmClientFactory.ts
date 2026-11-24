import { env } from '../../../config/env.js';
import { GeminiClient } from './geminiClient.js';
import { MockLlmClient } from './mockLlmClient.js';
import { OpenAiCompatibleClient } from './openAiCompatibleClient.js';
import { LlmError, type LlmClient } from './types.js';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const OLLAMA_BASE_URL = 'http://localhost:11434/v1';

/** Picks the provider from LLM_PROVIDER. */
export function createLlmClient(config = env): LlmClient {
  switch (config.LLM_PROVIDER) {
    case 'groq':
      requireKey(config.LLM_API_KEY, 'groq');
      return new OpenAiCompatibleClient('groq', config.LLM_MODEL, config.LLM_BASE_URL || GROQ_BASE_URL, config.LLM_API_KEY);
    case 'ollama':
      return new OpenAiCompatibleClient('ollama', config.LLM_MODEL, config.LLM_BASE_URL || OLLAMA_BASE_URL, '');
    case 'gemini':
      requireKey(config.LLM_API_KEY, 'gemini');
      return new GeminiClient(config.LLM_MODEL, config.LLM_API_KEY, config.LLM_BASE_URL || undefined);
    case 'mock':
      return new MockLlmClient();
  }
}

function requireKey(key: string, provider: string): void {
  if (!key) throw new LlmError('CONFIG', `LLM_API_KEY is required for provider ${provider}`);
}
