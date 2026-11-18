"use client";

import { Eye, PenLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { inputClass, Label } from "@/components/admin/fields";
import { useEditorState, useSave } from "@/components/admin/store";
import { buttonClass, Dialog, ErrorText } from "@/components/admin/ui";
import type { ArticleSource } from "@/content/articles";
import { slugify } from "@/lib/content-schema";
import { cn } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

/** Write a new article, or edit or delete one. `slug` null means new. */
export function ArticleEditor({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const { content } = useEditorState();
  const { save } = useSave();
  const router = useRouter();
  const all = content?.articles ?? [];
  const original = slug ? all.find((a) => a.slug === slug) : undefined;

  const [draft, setDraft] = useState<ArticleSource>(
    () =>
      original ?? { slug: "", title: "", summary: "", date: today(), tags: [], draft: false, body: "" },
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(original));
  const [tags, setTags] = useState(draft.tags.join(", "));
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = (patch: Partial<ArticleSource>) => setDraft((d) => ({ ...d, ...patch }));

  async function submit() {
    setError("");
    const article: ArticleSource = {
      ...draft,
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      slug: slugify(draft.slug || draft.title),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (!article.title) return setError("Give the article a title.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(article.date)) return setError("The date should look like 2026-11-18.");
    if (all.some((a) => a.slug === article.slug && a.slug !== original?.slug)) {
      return setError(`Another article already uses the address /articles/${article.slug}. Change the slug.`);
    }
    const next = original ? all.map((a) => (a.slug === original.slug ? article : a)) : [article, ...all];
    setBusy(true);
    const result = await save("articles", next);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onClose();
    if (!article.draft && article.slug !== slug) router.push(`/articles/${article.slug}`);
  }

  async function remove() {
    if (!original) return;
    setBusy(true);
    const result = await save("articles", all.filter((a) => a.slug !== original.slug));
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onClose();
    if (window.location.pathname === `/articles/${original.slug}`) router.push("/articles");
  }

  return (
    <Dialog
      wide
      title={original ? "Edit article" : "New article"}
      onClose={onClose}
      footer={
        <>
          {original &&
            (confirmDelete ? (
              <span className="flex items-center gap-2 text-[13px] text-red-200">
                Delete for good?
                <button type="button" className={buttonClass.danger} onClick={remove} disabled={busy}>
                  Yes, delete
                </button>
                <button type="button" className={buttonClass.ghost} onClick={() => setConfirmDelete(false)}>
                  Keep
                </button>
              </span>
            ) : (
              <button type="button" className={buttonClass.danger} onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> Delete
              </button>
            ))}
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className={buttonClass.ghost} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={buttonClass.primary} onClick={submit} disabled={busy}>
              {busy ? "Saving…" : draft.draft ? "Save draft" : original ? "Save" : "Publish"}
            </button>
          </div>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="article-title">Title</Label>
          <input
            id="article-title"
            className={cn(inputClass, "text-[17px] font-medium")}
            value={draft.title}
            autoFocus
            onChange={(e) =>
              update({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })
            }
          />
        </div>
        <div>
          <Label htmlFor="article-summary" hint="One sentence, shown in the list and in link previews.">
            Summary
          </Label>
          <textarea
            id="article-summary"
            rows={2}
            className={cn(inputClass, "resize-y")}
            value={draft.summary}
            onChange={(e) => update({ summary: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="article-date">Date</Label>
            <input id="article-date" type="date" className={inputClass} value={draft.date} onChange={(e) => update({ date: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="article-tags">Tags (comma separated)</Label>
            <input id="article-tags" className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
        </div>
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="article-slug">Address</Label>
            <div className="flex items-center rounded-xl border border-white/12 bg-black/30 pl-3 text-[14px] text-soft focus-within:border-[#ff7a1a]/70">
              /articles/
              <input
                id="article-slug"
                className="w-full bg-transparent py-2 pr-3 text-fg outline-none"
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") });
                }}
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/12 px-3 py-2 text-[13.5px]">
            <input
              type="checkbox"
              className="size-4 cursor-pointer accent-[#ff7a1a]"
              checked={draft.draft}
              onChange={(e) => update({ draft: e.target.checked })}
            />
            Draft (hidden)
          </label>
        </div>

        <div>
          <div className="mb-1.5 flex items-end justify-between gap-3">
            <Label htmlFor="article-body" hint="Markdown: ## heading, **bold**, *italic*, - list, [link](https://…), `code`">
              Text
            </Label>
            <div className="mb-1.5 flex shrink-0 rounded-full border border-white/12 p-0.5 text-[12.5px]">
              {[
                { on: false, label: "Write", icon: PenLine },
                { on: true, label: "Preview", icon: Eye },
              ].map(({ on, label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPreview(on)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors",
                    preview === on ? "bg-white/[0.12] text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
          {preview ? (
            <div className="prose min-h-72 rounded-xl border border-white/12 bg-black/30 px-4 py-3">
              {draft.body.trim() ? <Markdown remarkPlugins={[remarkGfm]}>{draft.body}</Markdown> : <p className="text-soft">Nothing yet.</p>}
            </div>
          ) : (
            <textarea
              id="article-body"
              className={cn(inputClass, "min-h-72 resize-y font-mono text-[13.5px] leading-relaxed")}
              rows={16}
              value={draft.body}
              onChange={(e) => update({ body: e.target.value })}
            />
          )}
        </div>
        <ErrorText>{error}</ErrorText>
      </div>
    </Dialog>
  );
}
