import { MouseBase } from "mousebase";

export interface CrewAIMemoryConfig {
  apiKey?: string;
  baseUrl?: string;
  crew: string;
  session?: string;
  topK?: number;
}

export class MouseBaseCrewMemory {
  private client: MouseBase;
  private crew: string;
  private session: string;
  private topK: number;

  constructor(config: CrewAIMemoryConfig) {
    this.client = new MouseBase({ apiKey: config.apiKey, baseUrl: config.baseUrl });
    this.crew = config.crew;
    this.session = config.session ?? "default";
    this.topK = config.topK ?? 10;
  }

  async add(context: string, metadata?: Record<string, unknown>): Promise<string> {
    const res = await this.client.remember({
      content: context,
      metadata: {
        ...metadata,
        crew: this.crew,
        session: this.session,
        source: "crewai",
        timestamp: new Date().toISOString(),
      },
    });
    return res.memory_id;
  }

  async search(query: string, limit?: number): Promise<Array<{ id: string; content: string; metadata: Record<string, unknown>; score: number }>> {
    const res = await this.client.search({
      query: `(${query}) crew:${this.crew} session:${this.session}`,
      top_k: limit ?? this.topK,
    });
    return res.results.map((r) => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata as Record<string, unknown>,
      score: r.score,
    }));
  }

  async clear(): Promise<void> {
    const res = await this.client.search({ query: `crew:${this.crew} session:${this.session}`, top_k: 100 });
    for (const r of res.results) {
      await this.client.delete(r.id);
    }
  }
}