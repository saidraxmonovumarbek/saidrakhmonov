import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Reveal, SplitText } from "@/components/motion";
import { site } from "@/content/site";
import { getArticle, getArticles } from "@/lib/articles";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      publishedTime: article.date,
      authors: [site.name],
    },
  };
}

export default function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <ArticleView params={params} />
    </Suspense>
  );
}

/** Shown for a moment while an article that was not pre-built is loading. */
function ArticleSkeleton() {
  return (
    <div className="animate-pulse px-5 pt-10 pb-24 sm:px-6" aria-busy="true" aria-label="Loading article">
      <div className="h-4 w-28 rounded bg-chip" />
      <div className="mt-9 h-3 w-48 rounded bg-chip" />
      <div className="mt-4 h-12 w-4/5 rounded-lg bg-chip" />
      <div className="mt-5 h-4 w-full max-w-xl rounded bg-chip" />
      <div className="mt-2.5 h-4 w-2/3 max-w-md rounded bg-chip" />
    </div>
  );
}

async function ArticleView({ params }: Pick<PageProps<"/articles/[slug]">, "params">) {
  const { slug } = await params;
  const articles = await getArticles();
  const index = articles.findIndex((a) => a.slug === slug);
  if (index === -1) notFound();
  const article = articles[index];
  const newer = articles[index - 1];
  const older = articles[index + 1];

  return (
    <article>
      <header className="px-5 pt-10 pb-9 sm:px-6">
        <Link
          href="/articles"
          className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          All articles
        </Link>
        <p className="mt-8 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-soft">
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          <span aria-hidden>/</span>
          <span>{article.readingMinutes} min read</span>
          {article.tags.map((tag) => (
            <span key={tag} className="rounded border border-chip-line bg-chip px-1.5 py-0.5 text-muted">
              {tag}
            </span>
          ))}
        </p>
        <SplitText
          as="h1"
          immediate
          text={article.title}
          className="mt-3 font-serif text-[2.6rem] leading-[1.05] tracking-[-0.015em] sm:text-[3.4rem]"
        />
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{article.summary}</p>
      </header>

      <div className="band" aria-hidden />

      <Reveal className="prose px-5 py-10 sm:px-6" delay={0.15}>
        <Markdown remarkPlugins={[remarkGfm]}>{article.content}</Markdown>
      </Reveal>

      <div className="band" aria-hidden />
      <nav aria-label="More articles" className="grid sm:grid-cols-2">
        {older ? (
          <Link
            href={`/articles/${older.slug}`}
            className="group px-5 py-6 transition-colors hover:bg-band sm:border-r sm:border-dashed sm:border-line sm:px-6"
          >
            <span className="flex items-center gap-1.5 font-mono text-xs text-soft">
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              Older
            </span>
            <span className="mt-1.5 block font-serif text-2xl leading-tight">{older.title}</span>
          </Link>
        ) : (
          <span className="max-sm:hidden sm:border-r sm:border-dashed sm:border-line" />
        )}
        {newer && (
          <Link
            href={`/articles/${newer.slug}`}
            className="group px-5 py-6 text-right transition-colors hover:bg-band max-sm:rule-t sm:px-6"
          >
            <span className="flex items-center justify-end gap-1.5 font-mono text-xs text-soft">
              Newer
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="mt-1.5 block font-serif text-2xl leading-tight">{newer.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
