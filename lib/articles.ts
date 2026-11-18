import type { ArticleSource } from "@/content/articles";
import { getContent } from "@/lib/content";

/**
 * Articles live with the rest of the content: written and edited in the admin
 * editor, starting from content/articles.ts. Drafts are left out here.
 */

export interface Article {
  slug: string;
  title: string;
  summary: string;
  /** ISO date, e.g. 2026-11-10 */
  date: string;
  tags: string[];
  readingMinutes: number;
  content: string;
}

export function readingMinutes(body: string) {
  return Math.max(1, Math.round(body.trim().split(/\s+/).length / 200));
}

export function publishedArticles(sources: ArticleSource[]): Article[] {
  return sources
    .filter((a) => !a.draft && a.slug)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      date: a.date,
      tags: a.tags ?? [],
      readingMinutes: readingMinutes(a.body ?? ""),
      content: a.body ?? "",
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getArticles(): Promise<Article[]> {
  return publishedArticles((await getContent()).articles);
}

export async function getArticle(slug: string): Promise<Article | null> {
  return (await getArticles()).find((a) => a.slug === slug) ?? null;
}
