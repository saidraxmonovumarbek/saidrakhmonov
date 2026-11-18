import type { MetadataRoute } from "next";
import { publishedArticles } from "@/lib/articles";
import { getContent } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { site, nav, articles } = await getContent();
  const pages = [...nav.main, ...nav.more]
    .filter((item) => item.href.startsWith("/"))
    .map((item) => ({ url: `${site.url}${item.href}` }));
  const posts = publishedArticles(articles).map((a) => ({
    url: `${site.url}/articles/${a.slug}`,
    lastModified: a.date,
  }));
  return [...pages, ...posts];
}
