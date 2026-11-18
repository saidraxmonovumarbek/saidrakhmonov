"use client";

import { ChevronDown, Eye, FilePlus2, LogOut, MousePointerClick, Pencil, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/admin/actions";
import { ArticleEditor } from "@/components/admin/article-editor";
import { FieldEditor } from "@/components/admin/fields";
import { ensureContent, setEditing, useEditorState, useSave } from "@/components/admin/store";
import { buttonClass, ErrorText } from "@/components/admin/ui";
import type { Content, ContentKey } from "@/lib/content-defaults";
import { SECTIONS, tidy } from "@/lib/content-schema";
import { cn, formatDate } from "@/lib/utils";

type Stats = { unique: number; visits: number; today: number; week: number } | null;

export function Dashboard({ stats, email, database }: { stats: Stats; email: string; database: "ok" | "local" | "missing" }) {
  const { content } = useEditorState();
  const router = useRouter();
  const [article, setArticle] = useState<string | null | undefined>(undefined);
  const [open, setOpen] = useState<ContentKey | null>(null);

  useEffect(() => {
    void ensureContent();
  }, []);

  const articles = [...(content?.articles ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-3 pb-16">
      <header data-panel className="card mt-6 px-5 pt-10 pb-8 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-lilac uppercase">Admin</p>
            <h1 className="mt-3 text-5xl leading-none font-medium tracking-[-0.045em]">Dashboard</h1>
            <p className="mt-3 text-[15px] text-muted">Logged in as {email}</p>
          </div>
          <form action={logout}>
            <button type="submit" className={buttonClass.ghost}>
              <LogOut className="size-4" /> Log out
            </button>
          </form>
        </div>
        {database !== "ok" && (
          <p className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-[14px] leading-relaxed text-amber-100">
            {database === "missing"
              ? "No database is connected, so edits can't be saved and visitors aren't counted. In Vercel open Storage → Create → Neon, connect it to this project, then redeploy."
              : "Running locally: edits and visits are saved to the .data folder on this computer, not to the live site."}
          </p>
        )}
      </header>

      <section data-panel className="card grid grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Visitors", value: stats?.unique, icon: true },
          { label: "Visits", value: stats?.visits },
          { label: "Last 24 hours", value: database === "ok" ? stats?.today : undefined },
          { label: "Last 7 days", value: database === "ok" ? stats?.week : undefined },
        ].map((s, i) => (
          <div key={s.label} className={cn("border-line px-5 py-6 sm:px-7", i % 2 === 1 && "border-l", i > 1 && "max-sm:rule-t sm:border-l")}>
            <p className="flex items-center gap-1.5 text-[13px] text-muted">
              {s.icon && <Eye className="size-4" />}
              {s.label}
            </p>
            <p className="mt-1.5 text-3xl font-medium tracking-[-0.03em]">{s.value?.toLocaleString("en-US") ?? "—"}</p>
          </div>
        ))}
      </section>

      <section data-panel className="card flex flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-7">
        <div className="flex items-start gap-3">
          <MousePointerClick className="mt-0.5 size-5 shrink-0 text-lilac" />
          <div>
            <h2 className="text-lg font-medium tracking-[-0.02em]">Edit right on the page</h2>
            <p className="mt-0.5 text-[14.5px] text-muted">
              Press <b className="text-fg">Edit</b> in the bottom-left corner on any page, then click any outlined text to change it.
            </p>
          </div>
        </div>
        <button
          type="button"
          className={buttonClass.primary}
          onClick={() => {
            setEditing(true);
            router.push("/");
          }}
        >
          <Pencil className="size-4" /> Edit the site
        </button>
      </section>

      <section data-panel className="card">
        <div className="rule-b flex items-center justify-between gap-3 px-5 pt-5 pb-4 sm:px-7">
          <h2 className="text-[1.4rem] leading-none font-medium tracking-[-0.03em]">Articles</h2>
          <button type="button" className={buttonClass.primary} onClick={() => setArticle(null)}>
            <FilePlus2 className="size-4" /> New article
          </button>
        </div>
        {!content ? (
          <p className="px-5 py-6 text-muted sm:px-7">Loading…</p>
        ) : articles.length === 0 ? (
          <p className="px-5 py-6 text-muted sm:px-7">No articles yet.</p>
        ) : (
          <ul>
            {articles.map((a, i) => (
              <li key={a.slug} className={i > 0 ? "rule-t" : undefined}>
                <button
                  type="button"
                  onClick={() => setArticle(a.slug)}
                  className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.04] sm:px-7"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-medium">{a.title || "Untitled"}</span>
                    <span className="mt-0.5 block font-mono text-xs text-lilac/80">
                      {formatDate(a.date)} · /articles/{a.slug}
                    </span>
                  </span>
                  {a.draft && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[12px] text-amber-100">Draft</span>
                  )}
                  <Pencil className="size-4 shrink-0 text-soft" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-panel className="card">
        <div className="rule-b px-5 pt-5 pb-4 sm:px-7">
          <h2 className="text-[1.4rem] leading-none font-medium tracking-[-0.03em]">Everything else</h2>
          <p className="mt-2 text-[14px] text-muted">
            Every section of the site as a form, including links and settings that don&apos;t show as text.
          </p>
        </div>
        <ul>
          {SECTIONS.map((s, i) => (
            <li key={s.key} className={i > 0 ? "rule-t" : undefined}>
              <button
                type="button"
                aria-expanded={open === s.key}
                onClick={() => setOpen(open === s.key ? null : s.key)}
                className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.04] sm:px-7"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-medium">{s.title}</span>
                  <span className="block text-[13.5px] text-muted">{s.note}</span>
                </span>
                <ChevronDown className={cn("size-5 shrink-0 text-soft transition-transform", open === s.key && "rotate-180")} />
              </button>
              {open === s.key && content && <SectionEditor key={s.key} sectionKey={s.key} content={content} />}
            </li>
          ))}
        </ul>
      </section>

      {article !== undefined && <ArticleEditor slug={article} onClose={() => setArticle(undefined)} />}
    </div>
  );
}

function SectionEditor({ sectionKey, content }: { sectionKey: ContentKey; content: Content }) {
  const { save, reset } = useSave();
  const [draft, setDraft] = useState<unknown>(content[sectionKey]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const changed = JSON.stringify(draft) !== JSON.stringify(content[sectionKey]);

  async function run(job: () => ReturnType<typeof save>, done: string) {
    setBusy(true);
    setMessage(null);
    const result = await job();
    setBusy(false);
    setMessage(result.ok ? { ok: true, text: done } : { ok: false, text: result.error });
    return result.ok;
  }

  return (
    <div className="border-t border-white/[0.06] bg-black/15 px-5 py-6 sm:px-7">
      <FieldEditor value={draft} onChange={setDraft} shape={sectionKey} name="" />
      <div className="sticky bottom-0 -mx-5 mt-6 flex flex-wrap items-center gap-2 border-t border-white/[0.06] bg-[#0d0919]/90 px-5 py-3 backdrop-blur sm:-mx-7 sm:px-7">
        <button
          type="button"
          className={buttonClass.danger}
          disabled={busy}
          onClick={async () => {
            if (!window.confirm("Go back to the original text for this whole section? Your edits to it are removed.")) return;
            const ok = await run(() => reset(sectionKey), "Back to the original.");
            const fresh = ok ? await ensureContent() : null;
            if (fresh) setDraft(fresh[sectionKey]);
          }}
        >
          <RotateCcw className="size-4" /> Reset to original
        </button>
        <span className="ml-auto text-[13px]">
          {message?.ok && <span className="text-emerald-300">{message.text}</span>}
          {message && !message.ok && <ErrorText>{message.text}</ErrorText>}
        </span>
        <button type="button" className={buttonClass.ghost} disabled={busy || !changed} onClick={() => setDraft(content[sectionKey])}>
          Discard
        </button>
        <button
          type="button"
          className={buttonClass.primary}
          disabled={busy || !changed}
          onClick={async () => {
            const clean = tidy(draft) as Content[ContentKey];
            if (await run(() => save(sectionKey, clean), "Saved.")) setDraft(clean);
          }}
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
