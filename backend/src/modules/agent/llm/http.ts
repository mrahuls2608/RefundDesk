import { LlmError } from './types.js';

/** POSTs JSON with a hard timeout and maps HTTP failures to typed LlmErrors. */
export async function postJson(url: string, body: unknown, headers: Record<string, string>, timeoutMs: number): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const name = (err as Error).name;
    if (name === 'TimeoutError' || name === 'AbortError') throw new LlmError('TIMEOUT', 'LLM request timed out');
    throw new LlmError('SERVER', `LLM request failed: ${(err as Error).message}`);
  }
  if (response.status === 429) throw new LlmError('RATE_LIMITED', 'LLM provider rate limit');
  if (response.status >= 500) throw new LlmError('SERVER', `LLM provider error ${response.status}`);
  if (!response.ok) throw new LlmError('BAD_RESPONSE', `LLM provider rejected request (${response.status})`);
  try {
    return await response.json();
  } catch {
    throw new LlmError('BAD_RESPONSE', 'LLM provider returned non-JSON');
  }
}
