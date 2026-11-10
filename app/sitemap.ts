import type { MetadataRoute } from "next";
import { nav, site } from "@/content/site";
import { getArticles } from "@/lib/articles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [...nav.main, ...nav.more].map((item) => ({ url: `${site.url}${item.href}` }));
  const articles = (await getArticles()).map((a) => ({
    url: `${site.url}/articles/${a.slug}`,
    lastModified: a.date,
  }));
  return [...pages, ...articles];
}
