import { MouseBase } from "mousebase";

export interface OpenAIAgentMemoryConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultThreadId?: string;
}

export class MouseBaseAgentMemory {
  private client: MouseBase;

  constructor(config: OpenAIAgentMemoryConfig) {
    this.client = new MouseBase({ apiKey: config.apiKey, baseUrl: config.baseUrl });
  }

  async storeMessage(message: { role: string; content: string; threadId?: string }): Promise<void> {
    await this.client.remember({
      content: message.content,
      metadata: {
        role: message.role,
        thread_id: message.threadId ?? "default",
        source: "openai-agents",
      },
    });
  }

  async retrieveMessages(threadId: string, limit?: number): Promise<Array<{ role: string; content: string }>> {
    const res = await this.client.search({ query: `thread_id:${threadId}`, top_k: limit ?? 50 });
    return res.results.map((r) => ({
      role: (r.metadata as Record<string, string>).role ?? "user",
      content: r.content,
    }));
  }

  async searchMemories(query: string, threadId?: string): Promise<Array<{ role: string; content: string; score: number }>> {
    const q = threadId ? `(${query}) thread_id:${threadId}` : query;
    const res = await this.client.search({ query: q, top_k: 10 });
    return res.results.map((r) => ({
      role: (r.metadata as Record<string, string>).role ?? "user",
      content: r.content,
      score: r.score,
    }));
  }

  async clear(threadId?: string): Promise<void> {
    const q = threadId ? `thread_id:${threadId}` : "source:openai-agents";
    const res = await this.client.search({ query: q, top_k: 100 });
    for (const r of res.results) {
      await this.client.delete(r.id);
    }
  }
}