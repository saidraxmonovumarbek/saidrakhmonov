import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Stagger, StaggerItem } from "@/components/motion";
import type { Article } from "@/lib/articles";
import { formatDate } from "@/lib/utils";

export function ArticleList({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return <p className="px-5 py-10 text-muted sm:px-6">Nothing published yet. Check back soon.</p>;
  }
  return (
    <Stagger as="ul">
      {articles.map((article, i) => (
        <StaggerItem as="li" key={article.slug} className={i > 0 ? "rule-t" : undefined}>
          <Link
            href={`/articles/${article.slug}`}
            className="group block px-5 py-6 transition-colors hover:bg-band sm:px-6"
          >
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-soft">
              <time dateTime={article.date}>{formatDate(article.date)}</time>
              <span aria-hidden>/</span>
              <span>{article.readingMinutes} min read</span>
              {article.tags.map((tag) => (
                <span key={tag} className="rounded border border-chip-line bg-chip px-1.5 py-0.5 text-muted">
                  {tag}
                </span>
              ))}
            </p>
            <h3 className="mt-2.5 flex items-start justify-between gap-4 font-serif text-[1.75rem] leading-[1.12]">
              <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                {article.title}
              </span>
              <ArrowUpRight className="mt-1 size-5 shrink-0 text-soft transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg" />
            </h3>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted">{article.summary}</p>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
