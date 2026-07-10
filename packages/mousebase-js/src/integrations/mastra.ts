import { MouseBase } from "mousebase";

export interface MastraMemoryConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultThreadId?: string;
  topK?: number;
}

export interface StoreOptions {
  content: string;
  threadId?: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

export interface MastraMemoryEntry {
  id: string;
  content: string;
  role: string;
  threadId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export class MouseBaseMastraMemory {
  private client: MouseBase;
  private defaultThreadId: string;
  private topK: number;

  constructor(config: MastraMemoryConfig) {
    this.client = new MouseBase({ apiKey: config.apiKey, baseUrl: config.baseUrl });
    this.defaultThreadId = config.defaultThreadId ?? "default";
    this.topK = config.topK ?? 20;
  }

  async store(options: StoreOptions): Promise<string> {
    const res = await this.client.remember({
      content: options.content,
      metadata: {
        ...options.metadata,
        role: options.role ?? "user",
        thread_id: options.threadId ?? this.defaultThreadId,
        source: "mastra",
      },
    });
    return res.memory_id;
  }

  async retrieve(threadId?: string): Promise<MastraMemoryEntry[]> {
    const tid = threadId ?? this.defaultThreadId;
    const res = await this.client.search({ query: `thread_id:${tid}`, top_k: this.topK });
    return res.results.map((r) => ({
      id: r.id,
      content: r.content,
      role: (r.metadata as Record<string, string>).role ?? "user",
      threadId: tid,
      metadata: r.metadata as Record<string, unknown>,
      createdAt: (r.metadata as Record<string, string>).timestamp ?? "",
    }));
  }

  async search(query: string, threadId?: string): Promise<MastraMemoryEntry[]> {
    const tid = threadId ?? this.defaultThreadId;
    const res = await this.client.search({ query: `(${query}) thread_id:${tid}`, top_k: this.topK });
    return res.results.map((r) => ({
      id: r.id,
      content: r.content,
      role: (r.metadata as Record<string, string>).role ?? "user",
      threadId: tid,
      metadata: r.metadata as Record<string, unknown>,
      createdAt: (r.metadata as Record<string, string>).timestamp ?? "",
    }));
  }

  async clear(threadId?: string): Promise<void> {
    const tid = threadId ?? this.defaultThreadId;
    const res = await this.client.search({ query: `thread_id:${tid} source:mastra`, top_k: 100 });
    for (const r of res.results) {
      await this.client.delete(r.id);
    }
  }
}