"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  FilePlus2,
  LayoutDashboard,
  ListPlus,
  LogOut,
  Pencil,
  PencilOff,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { logout } from "@/app/admin/actions";
import { ArticleEditor } from "@/components/admin/article-editor";
import { FieldEditor, IconButton, inputClass, itemTitle, listOps } from "@/components/admin/fields";
import { ensureContent, restoreEditing, setEditing, useEditorState, useSave } from "@/components/admin/store";
import { buttonClass, Dialog, EDITOR_UI, ErrorText } from "@/components/admin/ui";
import type { Content, ContentKey } from "@/lib/content-defaults";
import { getAt, parentList, resolve, setAt, shapeOf, type Step } from "@/lib/content-path";
import { blankItem, HINTS, labelFor, LIST_NAMES, tidy } from "@/lib/content-schema";
import { cn } from "@/lib/utils";

const ui = { [EDITOR_UI]: "" };

/** The new section after replacing the value at `steps` (steps[0] is the section key). */
function sectionWith(content: Content, steps: Step[], value: unknown) {
  const key = steps[0] as ContentKey;
  return tidy(setAt(content[key], steps.slice(1), value)) as Content[ContentKey];
}

/** "Project · Fokus · Title" */
function describe(content: Content, steps: Step[]) {
  const parts: string[] = [];
  const list = parentList(steps);
  if (list) {
    parts.push(labelFor(LIST_NAMES[shapeOf(list.list)] ?? "item"));
    const item = getAt(content, list.item);
    if (typeof item === "object") parts.push(itemTitle(item, `#${list.index + 1}`));
  } else {
    parts.push(labelFor(String(steps[0])));
  }
  const last = steps[steps.length - 1];
  if (typeof last === "string" && last !== steps[0]) parts.push(labelFor(last));
  return parts.join(" · ");
}

type Target =
  | { kind: "field"; steps: Step[]; anchor: HTMLElement }
  | { kind: "item"; list: Step[]; index: number; draft: unknown; isNew: boolean }
  | { kind: "article"; slug: string | null };

/**
 * Everything you see when logged in: a small bar in the corner with Edit
 * mode, and, in edit mode, a click on any outlined text opens an editor
 * right next to it.
 */
export default function AdminTools() {
  const { content, editing } = useEditorState();
  const [target, setTarget] = useState<Target | null>(null);
  const [notice, setNotice] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    restoreEditing();
    void ensureContent();
    return () => document.documentElement.removeAttribute("data-editing");
  }, []);

  const flash = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice((n) => (n === text ? "" : n)), 2600);
  }, []);

  // in edit mode, clicks on editable text open the editor instead of following links
  useEffect(() => {
    if (!editing) return;
    const onClick = (event: MouseEvent) => {
      const element = (event.target as Element | null)?.closest<HTMLElement>("[data-edit]");
      if (!element || (event.target as Element).closest(`[${EDITOR_UI}]`)) return;
      event.preventDefault();
      event.stopPropagation();
      if (!content) return flash("Still loading, try again in a second.");
      const steps = resolve(content, element.dataset.edit ?? "");
      if (!steps) return flash("This one can only be changed from the dashboard.");
      if (steps[0] === "articles") {
        const article = content.articles[steps[1] as number];
        return setTarget({ kind: "article", slug: article?.slug ?? null });
      }
      const value = getAt(content, steps);
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const list = parentList(steps);
        if (list && list.item.length === steps.length) {
          return setTarget({ kind: "item", list: list.list, index: list.index, draft: value, isNew: false });
        }
      }
      setTarget({ kind: "field", steps, anchor: element });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [editing, content, flash]);

  const close = useCallback(() => setTarget(null), []);
  const articleSlug = pathname.startsWith("/articles/") ? decodeURIComponent(pathname.slice("/articles/".length)) : null;

  return (
    <>
      <div
        {...ui}
        className="glass fixed bottom-3 left-3 z-[80] flex items-center gap-0.5 rounded-full p-1 text-[13px] shadow-[0_12px_40px_-12px_rgb(0_0_0/0.8)] sm:bottom-4 sm:left-4"
      >
        <button
          type="button"
          onClick={() => {
            setEditing(!editing);
            if (!editing) flash("Click any outlined text to change it.");
          }}
          aria-pressed={editing}
          className={cn(
            "flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 font-semibold transition-colors",
            editing ? "bg-[#ff7a1a] text-[#160a05] hover:bg-[#ff8f3d]" : "text-fg hover:bg-white/[0.08]",
          )}
        >
          {editing ? <PencilOff className="size-4" /> : <Pencil className="size-4" />}
          <span>{editing ? "Done" : "Edit"}</span>
        </button>
        {articleSlug && (
          <BarButton label="Edit this article" onClick={() => setTarget({ kind: "article", slug: articleSlug })}>
            <SlidersHorizontal className="size-4" />
          </BarButton>
        )}
        <BarButton label="New article" onClick={() => setTarget({ kind: "article", slug: null })}>
          <FilePlus2 className="size-4" />
        </BarButton>
        <Link
          href="/admin"
          title="Dashboard"
          aria-label="Dashboard"
          className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
        >
          <LayoutDashboard className="size-4" />
        </Link>
        <form action={logout}>
          <BarButton label="Log out" submit>
            <LogOut className="size-4" />
          </BarButton>
        </form>
        {notice && (
          <span role="status" className="flex items-center gap-1.5 pr-3 pl-1.5 text-muted">
            {notice}
          </span>
        )}
      </div>

      {target?.kind === "field" && content && (
        <FieldPopover
          key={target.steps.join(".")}
          content={content}
          steps={target.steps}
          anchor={target.anchor}
          onClose={close}
          onSaved={() => flash("Saved")}
          onOpenItem={(list, index, draft, isNew) => setTarget({ kind: "item", list, index, draft, isNew })}
        />
      )}
      {target?.kind === "item" && content && (
        <ItemDialog content={content} {...target} onClose={close} onSaved={() => flash("Saved")} />
      )}
      {target?.kind === "article" && <ArticleEditor slug={target.slug} onClose={close} />}
    </>
  );
}

function BarButton({
  label,
  onClick,
  submit,
  children,
}: {
  label: string;
  onClick?: () => void;
  submit?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type={submit ? "submit" : "button"}
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid size-9 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// The little editor next to a piece of text

function FieldPopover({
  content,
  steps,
  anchor,
  onClose,
  onSaved,
  onOpenItem,
}: {
  content: Content;
  steps: Step[];
  anchor: HTMLElement;
  onClose: () => void;
  onSaved: () => void;
  onOpenItem: (list: Step[], index: number, draft: unknown, isNew: boolean) => void;
}) {
  const { save } = useSave();
  const original = getAt(content, steps);
  const [value, setValue] = useState<unknown>(original);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const list = parentList(steps);
  const listValue = list ? (getAt(content, list.list) as unknown[]) : null;
  const item = list ? getAt(content, list.item) : null;
  const itemIsObject = typeof item === "object" && item !== null;
  const noun = list ? (LIST_NAMES[shapeOf(list.list)] ?? "item") : "";
  const single = typeof original === "string" && !original.includes("\n") && original.length < 90;

  // sit just below the text (or above it near the bottom of the screen)
  useLayoutEffect(() => {
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const w = box.current?.offsetWidth ?? 400;
      const h = box.current?.offsetHeight ?? 220;
      const left = Math.min(Math.max(12, r.left), window.innerWidth - w - 12);
      const below = r.bottom + 10;
      const top = below + h > window.innerHeight - 12 && r.top - h - 10 > 12 ? r.top - h - 10 : below;
      setPos({ top, left });
    };
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [anchor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!box.current?.contains(t) && !t.closest?.("[data-edit]")) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    anchor.setAttribute("data-edit-active", "");
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
      anchor.removeAttribute("data-edit-active");
    };
  }, [anchor, onClose]);

  async function commit(section: Content[ContentKey]) {
    setBusy(true);
    setError("");
    const result = await save(steps[0] as ContentKey, section);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onSaved();
    onClose();
  }

  const submit = () => {
    const next = typeof value === "string" ? value.trim() : value;
    if (JSON.stringify(next) === JSON.stringify(original)) return onClose();
    void commit(sectionWith(content, steps, next));
  };

  const listAction = (next: unknown[]) => list && void commit(sectionWith(content, list.list, next));
  const ops = listValue ? listOps(listValue) : null;

  return createPortal(
    <div
      {...ui}
      ref={box}
      role="dialog"
      aria-label={`Edit ${describe(content, steps)}`}
      style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden", top: 0, left: 0 }}
      className="glass fixed z-[85] w-[min(26rem,calc(100vw-1.5rem))] rounded-2xl !bg-[#0f0a1c]/95 p-3 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.9)] max-sm:!top-auto max-sm:!bottom-16 max-sm:!left-3"
    >
      <p className="mb-2 truncate px-0.5 text-[12px] font-medium tracking-wide text-muted">{describe(content, steps)}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey || (single && !e.shiftKey && e.target instanceof HTMLTextAreaElement))) {
            e.preventDefault();
            submit();
          }
        }}
      >
        {typeof original === "string" ? (
          <textarea
            autoFocus
            value={value as string}
            onChange={(e) => setValue(e.target.value)}
            rows={single ? 1 : Math.min(9, Math.max(3, Math.ceil((value as string).length / 48)))}
            className={cn(inputClass, "resize-y leading-relaxed", single && "resize-none")}
          />
        ) : (
          <FieldEditor value={value} onChange={setValue} shape={shapeOf(steps)} name="" autoFocus />
        )}
        {HINTS[shapeOf(steps)] && <p className="mt-1.5 px-0.5 text-[12px] text-soft">{HINTS[shapeOf(steps)]}</p>}
        <ErrorText>{error}</ErrorText>

        <div className="mt-2.5 flex items-center gap-0.5">
          {list && ops && listValue && (
            <>
              {itemIsObject && (
                <IconButton label={`All fields of this ${noun}`} onClick={() => onOpenItem(list.list, list.index, item, false)}>
                  <SlidersHorizontal className="size-4" />
                </IconButton>
              )}
              <IconButton label="Move up" disabled={busy || list.index === 0} onClick={() => listAction(ops.move(list.index, -1))}>
                <ArrowUp className="size-4" />
              </IconButton>
              <IconButton
                label="Move down"
                disabled={busy || list.index === listValue.length - 1}
                onClick={() => listAction(ops.move(list.index, 1))}
              >
                <ArrowDown className="size-4" />
              </IconButton>
              <IconButton label="Duplicate" disabled={busy} onClick={() => listAction(ops.duplicate(list.index))}>
                <Copy className="size-4" />
              </IconButton>
              <IconButton
                label={`Add a new ${noun} after this one`}
                disabled={busy}
                onClick={() => {
                  const fresh = blankItem(shapeOf(list.list), listValue);
                  if (typeof fresh === "object" && fresh !== null) onOpenItem(list.list, list.index + 1, fresh, true);
                  else listAction([...listValue.slice(0, list.index + 1), fresh, ...listValue.slice(list.index + 1)]);
                }}
              >
                <ListPlus className="size-4" />
              </IconButton>
              <IconButton
                label={`Delete this ${noun}`}
                danger
                disabled={busy}
                onClick={() => window.confirm(`Delete this ${noun}?`) && listAction(ops.remove(list.index))}
              >
                <Trash2 className="size-4" />
              </IconButton>
            </>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" className={cn(buttonClass.ghost, "px-3 py-1.5")} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={cn(buttonClass.primary, "px-3.5 py-1.5")} disabled={busy}>
              <Check className="size-4" />
              {busy ? "Saving" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Every field of one item (a project, a job…)

function ItemDialog({
  content,
  list,
  index,
  draft: initial,
  isNew,
  onClose,
  onSaved,
}: {
  content: Content;
  list: Step[];
  index: number;
  draft: unknown;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { save } = useSave();
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const items = getAt(content, list) as unknown[];
  const noun = LIST_NAMES[shapeOf(list)] ?? "item";

  async function commit(next: unknown[]) {
    setBusy(true);
    setError("");
    const result = await save(list[0] as ContentKey, sectionWith(content, list, next));
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onSaved();
    onClose();
  }

  const submit = () =>
    commit(isNew ? [...items.slice(0, index), draft, ...items.slice(index)] : items.map((v, i) => (i === index ? draft : v)));

  return (
    <Dialog
      title={`${isNew ? "New" : "Edit"} ${noun}`}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button
              type="button"
              className={buttonClass.danger}
              disabled={busy}
              onClick={() => window.confirm(`Delete this ${noun}?`) && commit(items.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" /> Delete
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className={buttonClass.ghost} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={buttonClass.primary} disabled={busy} onClick={submit}>
              {busy ? "Saving…" : isNew ? `Add ${noun}` : "Save"}
            </button>
          </div>
        </>
      }
    >
      <FieldEditor value={draft} onChange={setDraft} shape={shapeOf(list)} name="" autoFocus />
      <div className="mt-4">
        <ErrorText>{error}</ErrorText>
      </div>
    </Dialog>
  );
}
