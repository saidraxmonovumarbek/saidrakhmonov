import type { Metadata } from "next";
import { ArticleList } from "@/components/article-list";
import { PageHeader } from "@/components/section";
import { publishedArticles } from "@/lib/articles";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Articles",
  description: "Notes on building things for the web.",
};

export default async function ArticlesPage() {
  const content = await getContent();
  const articles = publishedArticles(content.articles);
  const t = content.copy.pages.articles;
  return (
    <>
      <PageHeader
        eyebrow={`${articles.length} articles`}
        title={t.title}
        text={t.text}
        edit="copy.pages.articles"
      />
      <div data-panel className="card card-strong">
        <ArticleList articles={articles} empty={t.empty} />
      </div>
    </>
  );
}
