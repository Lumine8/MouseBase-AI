import { MouseBase } from "mousebase";

export interface LlamaMemoryConfig {
  apiKey?: string;
  baseUrl?: string;
  sessionId: string;
  topK?: number;
}

export class MouseBaseMemoryStore {
  private client: MouseBase;
  private sessionId: string;
  private topK: number;

  constructor(config: LlamaMemoryConfig) {
    this.client = new MouseBase({ apiKey: config.apiKey, baseUrl: config.baseUrl });
    this.sessionId = config.sessionId;
    this.topK = config.topK ?? 10;
  }

  async get(_inputs: Record<string, unknown>): Promise<unknown[]> {
    const ChatMessage = (await import("llama-index")).ChatMessage;
    const res = await this.client.search({ query: `session:${this.sessionId}`, top_k: this.topK });
    return res.results.map((r) => {
      const meta = r.metadata as Record<string, string>;
      return new ChatMessage({ role: meta.role ?? "user", content: r.content });
    });
  }

  async put(message: { role: string; content: string }): Promise<void> {
    await this.client.remember({
      content: message.content,
      metadata: { role: message.role, session_id: this.sessionId },
    });
  }

  async set(messages: Array<{ role: string; content: string }>): Promise<void> {
    await this.clear();
    for (const msg of messages) {
      await this.put(msg);
    }
  }

  async clear(): Promise<void> {
    const res = await this.client.search({ query: `session:${this.sessionId}`, top_k: 100 });
    for (const r of res.results) {
      await this.client.delete(r.id);
    }
  }

  async getMessages(sessionId: string, topK?: number): Promise<Array<{ role: string; content: string }>> {
    const res = await this.client.search({ query: `session:${sessionId}`, top_k: topK ?? 50 });
    return res.results.map((r) => ({
      role: (r.metadata as Record<string, string>).role ?? "user",
      content: r.content,
    }));
  }
}