import { Command } from "commander";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { MouseBase } from "../src/client.js";

function readline(question: string): Promise<string> {
  const rl = createInterface({ input, output });
  return rl.question(question).finally(() => rl.close());
}

function configPath(): string {
  const dir = join(homedir(), ".mousebase");
  return join(dir, "config.json");
}

function ensureConfigDir(): void {
  const dir = join(homedir(), ".mousebase");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function loadConfig(): { apiKey?: string } {
  const path = configPath();
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

function saveConfig(config: { apiKey?: string }): void {
  ensureConfigDir();
  writeFileSync(configPath(), JSON.stringify(config, null, 2), "utf-8");
}

function getClient(): MouseBase {
  const config = loadConfig();
  const key = config.apiKey ?? process.env.MOUSEBASE_API_KEY;
  if (!key) {
    console.error("Not logged in. Run `mousebase login` or set MOUSEBASE_API_KEY.");
    process.exit(1);
  }
  return new MouseBase({ apiKey: key });
}

export async function main(): Promise<void> {
  const program = new Command();

  program.name("mousebase").description("CLI for MouseBase AI memory").version("0.1.0");

  program
    .command("login")
    .description("Save your MouseBase API key")
    .action(async () => {
      const apiKey = await readline("Enter your MouseBase API key: ");
      if (!apiKey.trim()) {
        console.error("API key cannot be empty.");
        process.exit(1);
      }
      saveConfig({ apiKey: apiKey.trim() });
      console.log("API key saved to ~/.mousebase/config.json");
    });

  program
    .command("remember")
    .description("Store a memory")
    .argument("<content>", "Memory content to store")
    .action(async (content: string) => {
      const client = getClient();
      const result = await client.remember({ content });
      console.log(JSON.stringify(result, null, 2));
    });

  program
    .command("search")
    .description("Search memories")
    .argument("<query>", "Search query")
    .option("-k, --top-k <number>", "Number of results", "10")
    .action(async (query: string, options: { topK?: string }) => {
      const client = getClient();
      const topK = parseInt(options.topK ?? "10", 10);
      const result = await client.search({ query, top_k: topK });
      console.log(JSON.stringify(result, null, 2));
    });

  const projectsCmd = program.command("projects").description("Manage projects");

  projectsCmd
    .command("list")
    .description("List all projects")
    .action(async () => {
      const client = getClient();
      const projects = await client.projects.list();
      console.log(JSON.stringify(projects, null, 2));
    });

  projectsCmd
    .command("create")
    .description("Create a new project")
    .argument("<name>", "Project name")
    .action(async (name: string) => {
      const client = getClient();
      const project = await client.projects.create({ name });
      console.log(JSON.stringify(project, null, 2));
    });

  await program.parseAsync(process.argv);
}