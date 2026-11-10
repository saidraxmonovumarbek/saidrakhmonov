import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cacheLife } from "next/cache";

/**
 * Articles are Markdown files in content/articles.
 * To publish a new one, add a `my-title.md` file with this at the top:
 *
 * ---
 * title: "My title"
 * summary: "One sentence about it."
 * date: 2026-11-10
 * tags: [Tag one, Tag two]
 * ---
 *
 * Add `draft: true` to hide an article while you are still writing it.
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

const DIR = path.join(process.cwd(), "content", "articles");

export async function getArticles(): Promise<Article[]> {
  "use cache";
  cacheLife("max");

  const files = fs.existsSync(DIR)
    ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md"))
    : [];

  const articles: Article[] = [];
  for (const file of files) {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
    if (data.draft) continue;
    const date =
      data.date instanceof Date
        ? data.date.toISOString().slice(0, 10)
        : String(data.date ?? "1970-01-01");
    const words = content.trim().split(/\s+/).length;
    articles.push({
      slug: file.replace(/\.md$/, ""),
      title: String(data.title ?? file),
      summary: String(data.summary ?? ""),
      date,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      readingMinutes: Math.max(1, Math.round(words / 200)),
      content,
    });
  }
  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getArticle(slug: string): Promise<Article | null> {
  const all = await getArticles();
  return all.find((a) => a.slug === slug) ?? null;
}
