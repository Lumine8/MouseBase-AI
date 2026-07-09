import { MouseBase } from "mousebase";

export interface MouseBaseMemoryConfig {
  apiKey?: string;
  baseUrl?: string;
  sessionId: string;
  topK?: number;
}

export class MouseBaseMemory {
  private client: MouseBase;
  private sessionId: string;
  private topK: number;

  constructor(config: MouseBaseMemoryConfig) {
    this.client = new MouseBase({ apiKey: config.apiKey, baseUrl: config.baseUrl });
    this.sessionId = config.sessionId;
    this.topK = config.topK ?? 10;
  }

  async loadMemoryVariables(_values: Record<string, unknown>): Promise<Record<string, unknown>> {

    const res = await this.client.search({ query: `session:${this.sessionId}`, top_k: this.topK });
    const history: Array<{ role: string; content: string }> = [];

    for (const r of res.results) {
      const meta = r.metadata as Record<string, string>;
      if (meta.role && meta.content) {
        history.push({ role: meta.role, content: meta.content });
      }
    }

    return { history };
  }

  async saveContext(
    inputValues: Record<string, unknown>,
    outputValues: Record<string, unknown>,
  ): Promise<void> {
    const inputContent = JSON.stringify(inputValues);
    const outputContent = JSON.stringify(outputValues);

    await this.client.remember({
      content: inputContent,
      metadata: { role: "human", session_id: this.sessionId },
    });

    await this.client.remember({
      content: outputContent,
      metadata: { role: "ai", session_id: this.sessionId },
    });
  }

  async clear(): Promise<void> {
    const res = await this.client.search({ query: `session:${this.sessionId}`, top_k: 100 });
    for (const r of res.results) {
      await this.client.delete(r.id);
    }
  }
}