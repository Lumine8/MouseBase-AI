import { MouseBase } from "../client.js";
import type {
  RememberOptions,
  RememberResponse,
  SearchOptions,
  SearchResponse,
  MemoryResponse,
  UpdateOptions,
} from "../types.js";

export interface MouseBaseOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export const MOUSEBASE_SERVICE_TOKEN = "MOUSEBASE_SERVICE";

export class MouseBaseService {
  private client: MouseBase;

  constructor(options?: MouseBaseOptions) {
    this.client = new MouseBase(options);
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

  get raw(): MouseBase {
    return this.client;
  }
}

export class MouseBaseModule {
  static forRoot(options?: MouseBaseOptions): any {
    const service = new MouseBaseService(options);
    const providers = [
      { provide: MOUSEBASE_SERVICE_TOKEN, useValue: service },
      { provide: MouseBaseService, useValue: service },
    ];
    const exports = [MOUSEBASE_SERVICE_TOKEN, MouseBaseService];
    try {
      const { Module } = require("@nestjs/common");
      if (Module) {
        const decorated = Module({
          module: MouseBaseModule,
          global: true,
          providers,
          exports,
        });
        return decorated(MouseBaseModule);
      }
    } catch {}
    return { module: MouseBaseModule, global: true, providers, exports };
  }
}

export function createMousebaseModule(options?: MouseBaseOptions): any {
  return MouseBaseModule.forRoot(options);
}