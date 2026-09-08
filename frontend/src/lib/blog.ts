export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "persistent-memory-for-ai-agents",
    title: "How to Add Persistent Memory to an AI Agent",
    date: "2026-09-08",
    excerpt: "A practical guide to giving AI agents long-term memory that survives across sessions.",
    tags: ["tutorial", "ai-agents", "memory"],
  },
  {
    slug: "introducing-mousebase",
    title: "Introducing MouseBase: Persistent Memory for AI Agents",
    date: "2026-07-09",
    excerpt: "We're building the memory layer for AI. Here's why.",
    tags: ["announcement"],
  },
  {
    slug: "hybrid-search-for-ai-memory",
    title: "Why Hybrid Search Beats Vector-Only for AI Memory",
    date: "2026-09-08",
    excerpt: "Combining semantic, keyword, and metadata signals gives better recall than embeddings alone.",
    tags: ["engineering", "search"],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
