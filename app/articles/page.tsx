import type { Metadata } from "next";
import { ArticleList } from "@/components/article-list";
import { PageHeader } from "@/components/section";
import { getArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Articles",
  description: "Notes on building things for the web.",
};

export default async function ArticlesPage() {
  const articles = await getArticles();
  return (
    <>
      <PageHeader
        eyebrow={`${articles.length} articles`}
        title="Articles"
        text="Notes on building for the web: what I am learning, what went wrong, and what I would do differently next time."
      />
      <div className="band" aria-hidden />
      <ArticleList articles={articles} />
    </>
  );
}
