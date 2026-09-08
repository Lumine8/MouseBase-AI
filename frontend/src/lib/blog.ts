import { api, BlogPostListItem, BlogPostResponse } from "./api";

export type { BlogPostListItem, BlogPostResponse };

export async function fetchBlogPosts(publishedOnly: boolean = true): Promise<BlogPostListItem[]> {
  return api.blog.list(publishedOnly);
}

export async function fetchBlogPost(slug: string): Promise<BlogPostResponse> {
  return api.blog.get(slug);
}
