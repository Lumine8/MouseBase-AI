import { MouseBase } from "../client.js";
import type {
  ClientConfig,
  RememberOptions,
  RememberResponse,
  SearchOptions,
  SearchResponse,
  MemoryResponse,
  UpdateOptions,
} from "../types.js";

export interface MousebaseRequest {
  mousebase: ExpressMouseBase;
}

export class ExpressMouseBase {
  private client: MouseBase;

  constructor(config?: ClientConfig) {
    this.client = new MouseBase(config);
  }

  async remember(options: RememberOptions): Promise<RememberResponse> {
    return this.client.remember(options);
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    return this.client.search(options);
  }

  async get(memoryId: string): Promise<MemoryResponse> {
    return this.client.get(memoryId);
  }

  async update(memoryId: string, options: UpdateOptions): Promise<MemoryResponse> {
    return this.client.update(memoryId, options);
  }

  async delete(memoryId: string): Promise<void> {
    return this.client.delete(memoryId);
  }

  get projects() {
    return this.client.projects;
  }
}

export function mousebaseMiddleware(config?: ClientConfig) {
  const instance = new ExpressMouseBase(config);
  return (req: any, _res: any, next: (err?: any) => void) => {
    req.mousebase = instance;
    next();
  };
}