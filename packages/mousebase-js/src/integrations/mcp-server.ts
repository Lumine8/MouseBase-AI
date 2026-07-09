import { MouseBase } from "mousebase";

export interface McpServerOptions {
  apiKey?: string;
  baseUrl?: string;
  name?: string;
  version?: string;
  topK?: number;
}

export async function createMousebaseMcpServer(options: McpServerOptions) {
  const client = new MouseBase({ apiKey: options.apiKey, baseUrl: options.baseUrl });
  const topK = options.topK ?? 10;

  const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
  } = await import("@modelcontextprotocol/sdk/types.js");

  const server = new Server(
    { name: options.name ?? "mousebase-mcp", version: options.version ?? "0.1.0" },
    { capabilities: { tools: {} } },
  );

  const MEMORY_TOOLS = [
    {
      name: "remember",
      description: "Store a memory in MouseBase",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "The memory content to store" },
          metadata: { type: "object", description: "Optional metadata key-value pairs" },
          externalId: { type: "string", description: "Optional external ID for the memory" },
        },
        required: ["content"],
      },
    },
    {
      name: "search",
      description: "Search memories in MouseBase",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
          limit: { type: "number", description: "Maximum number of results" },
        },
        required: ["query"],
      },
    },
    {
      name: "get_memory",
      description: "Get a specific memory by ID",
      inputSchema: {
        type: "object",
        properties: {
          memoryId: { type: "string", description: "The memory ID to retrieve" },
        },
        required: ["memoryId"],
      },
    },
    {
      name: "delete_memory",
      description: "Delete a memory by ID",
      inputSchema: {
        type: "object",
        properties: {
          memoryId: { type: "string", description: "The memory ID to delete" },
        },
        required: ["memoryId"],
      },
    },
    {
      name: "list_projects",
      description: "List all MouseBase projects",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: MEMORY_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request: { params: { name: string; arguments?: Record<string, unknown> } }) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "remember": {
          const res = await client.remember({
            content: args?.content as string,
            metadata: args?.metadata as Record<string, unknown> | undefined,
            externalId: args?.externalId as string | undefined,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(res) }],
          };
        }

        case "search": {
          const res = await client.search({
            query: args?.query as string,
            top_k: (args?.limit as number) ?? topK,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(res.results) }],
          };
        }

        case "get_memory": {
          const res = await client.get(args?.memoryId as string);
          return {
            content: [{ type: "text", text: JSON.stringify(res) }],
          };
        }

        case "delete_memory": {
          await client.delete(args?.memoryId as string);
          return {
            content: [{ type: "text", text: "Memory deleted" }],
          };
        }

        case "list_projects": {
          const res = await client.projects.list();
          return {
            content: [{ type: "text", text: JSON.stringify(res) }],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  return server;
}