import { MouseBase } from "../client.js";
import type { ClientConfig, RememberOptions, RememberResponse, SearchOptions, SearchResponse, MemoryResponse, UpdateOptions } from "../types.js";

export class NextMouseBase {
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

export interface WithMousebaseOptions extends ClientConfig {
  perRequest?: boolean;
}

let _defaultInstance: NextMouseBase | null = null;

function getDefaultInstance(): NextMouseBase {
  if (!_defaultInstance) {
    _defaultInstance = new NextMouseBase();
  }
  return _defaultInstance;
}

export type NextRouteHandler = (
  req: Request,
  context: { params: Promise<Record<string, string | string[]>> },
  mousebase: NextMouseBase,
) => Promise<Response>;

export type NextRouteContext = { params: Promise<Record<string, string | string[]>> };

export function withMousebase(handler: NextRouteHandler, config?: WithMousebaseOptions) {
  const instance = config?.perRequest ? new NextMouseBase(config) : getDefaultInstance();
  return async (req: Request, context: NextRouteContext): Promise<Response> => {
    return handler(req, context, instance);
  };
}

export type { NextRouteHandler as NextMousebaseRouteHandler };