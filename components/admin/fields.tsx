"use client";

import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { useId, type ReactNode } from "react";
import { blankItem, HINTS, labelFor, LIST_NAMES, LONG, OPTIONAL, OPTIONS, TEMPLATES, uniquify } from "@/lib/content-schema";
import { cn } from "@/lib/utils";

/**
 * A form for any piece of content, built from its value: text boxes for
 * text, toggles for yes/no, a line per entry for lists of words, and nested
 * cards for lists of things. `shape` is the path without indexes
 * (e.g. "projects.cover"), used to look up choices, hints and templates.
 */

export const inputClass =
  "w-full rounded-xl border border-white/12 bg-black/30 px-3 py-2 text-[14px] text-fg outline-none transition-colors placeholder:text-soft focus:border-[#ff7a1a]/70 focus:bg-black/40";

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-[12.5px] font-medium tracking-wide text-muted">
        {children}
      </label>
      {hint && <p className="mt-0.5 text-[12px] text-soft">{hint}</p>}
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  danger,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.08] hover:text-fg disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent",
        danger && "hover:!bg-red-500/15 hover:!text-red-300",
      )}
    >
      {children}
    </button>
  );
}

const isStringList = (value: unknown[], shape: string) =>
  value.every((v) => typeof v === "string") && (value.length > 0 || TEMPLATES[shape] === undefined);

/** Move, duplicate and remove items of a list. */
export function listOps<T>(list: T[]) {
  return {
    move: (i: number, by: number) => {
      const j = i + by;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    },
    duplicate: (i: number) => {
      const copy = [...list];
      copy.splice(i + 1, 0, uniquify(structuredClone(list[i]), list) as T);
      return copy;
    },
    remove: (i: number) => list.filter((_, k) => k !== i),
  };
}

/** One-line summary of an item, for list rows and headings. */
export function itemTitle(item: unknown, fallback: string): string {
  if (typeof item === "string") return item || fallback;
  if (typeof item !== "object" || item === null) return fallback;
  const r = item as Record<string, unknown>;
  for (const key of ["title", "name", "role", "degree", "label", "date"]) {
    if (typeof r[key] === "string" && r[key]) return r[key] as string;
  }
  return fallback;
}

export function FieldEditor({
  value,
  onChange,
  shape,
  name,
  autoFocus,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
  shape: string;
  /** The field's own name (last part of the shape); empty for the root. */
  name: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const hint = HINTS[shape];
  const label = name ? labelFor(name) + (OPTIONAL.has(name) ? " (optional)" : "") : "";

  if (typeof value === "boolean") {
    return (
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 py-1">
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 cursor-pointer accent-[#ff7a1a]"
        />
        <span>
          <span className="block text-[13.5px] font-medium">{label}</span>
          {hint && <span className="block text-[12px] text-soft">{hint}</span>}
        </span>
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <div>
        {label && <Label htmlFor={id} hint={hint}>{label}</Label>}
        <input
          id={id}
          type="number"
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className={inputClass}
          autoFocus={autoFocus}
        />
      </div>
    );
  }

  if (typeof value === "string" || value === undefined || value === null) {
    const text = value ?? "";
    const options = OPTIONS[shape];
    if (options) {
      return (
        <div>
          {label && <Label htmlFor={id} hint={hint}>{label}</Label>}
          <select id={id} value={text} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, "cursor-pointer")}>
            {!options.includes(text) && <option value={text}>{text || "Choose…"}</option>}
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      );
    }
    const long = LONG.has(name) || text.length > 70 || text.includes("\n");
    const color = /^#[0-9a-f]{6}$/i.test(text);
    return (
      <div>
        {label && <Label htmlFor={id} hint={hint}>{label}</Label>}
        {long ? (
          <textarea
            id={id}
            value={text}
            rows={Math.min(10, Math.max(3, Math.ceil(text.length / 60) + text.split("\n").length - 1))}
            onChange={(e) => onChange(e.target.value)}
            className={cn(inputClass, "resize-y leading-relaxed")}
            autoFocus={autoFocus}
          />
        ) : (
          <div className="flex gap-2">
            {color && (
              <input
                type="color"
                aria-label={`${label} colour`}
                value={text}
                onChange={(e) => onChange(e.target.value)}
                className="h-[38px] w-11 shrink-0 cursor-pointer rounded-xl border border-white/12 bg-black/30 p-1"
              />
            )}
            <input id={id} type="text" value={text} onChange={(e) => onChange(e.target.value)} className={inputClass} autoFocus={autoFocus} />
          </div>
        )}
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (isStringList(value, shape)) {
      const noun = LIST_NAMES[shape] ?? "entry";
      return (
        <div>
          {label && (
            <Label htmlFor={id} hint={hint ?? `One ${noun} per line.`}>
              {label}
            </Label>
          )}
          <textarea
            id={id}
            value={(value as string[]).join("\n")}
            rows={Math.min(10, Math.max(2, value.length + 1))}
            onChange={(e) => onChange(e.target.value.split("\n"))}
            onBlur={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
            className={cn(inputClass, "resize-y leading-relaxed")}
            autoFocus={autoFocus}
          />
        </div>
      );
    }
    return <ListEditor list={value} onChange={onChange} shape={shape} label={label} />;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    // show fields the template has but this item does not (empty optional ones)
    const template = (TEMPLATES[shape] ?? {}) as Record<string, unknown>;
    const keys = [...new Set([...Object.keys(record), ...Object.keys(template)])];
    const body = (
      <div className="space-y-4">
        {keys.map((key, i) => (
          <FieldEditor
            key={key}
            name={key}
            shape={shape ? `${shape}.${key}` : key}
            value={key in record ? record[key] : emptyLike(template[key])}
            onChange={(next) => onChange({ ...record, [key]: next })}
            autoFocus={autoFocus && i === 0}
          />
        ))}
      </div>
    );
    if (!label) return body;
    return (
      <fieldset className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <legend className="px-1.5 text-[12.5px] font-medium tracking-wide text-muted">{label}</legend>
        {body}
      </fieldset>
    );
  }

  return null;
}

function emptyLike(value: unknown): unknown {
  if (typeof value === "string") return "";
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return 0;
  if (Array.isArray(value)) return [];
  if (typeof value === "object" && value !== null) return structuredClone(value);
  return "";
}

/** A list of things (projects, contact links…): one card per item. */
function ListEditor({
  list,
  onChange,
  shape,
  label,
}: {
  list: unknown[];
  onChange: (next: unknown[]) => void;
  shape: string;
  label: string;
}) {
  const noun = LIST_NAMES[shape] ?? "item";
  const ops = listOps(list);
  return (
    <div>
      {label && <Label>{label}</Label>}
      <ol className="space-y-2.5">
        {list.map((item, i) => (
          <li key={i} className="rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-1 border-b border-white/[0.07] py-1 pr-1 pl-4">
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{itemTitle(item, `${labelFor(noun)} ${i + 1}`)}</span>
              <IconButton label="Move up" onClick={() => onChange(ops.move(i, -1))} disabled={i === 0}>
                <ArrowUp className="size-4" />
              </IconButton>
              <IconButton label="Move down" onClick={() => onChange(ops.move(i, 1))} disabled={i === list.length - 1}>
                <ArrowDown className="size-4" />
              </IconButton>
              <IconButton label="Duplicate" onClick={() => onChange(ops.duplicate(i))}>
                <Copy className="size-4" />
              </IconButton>
              <IconButton label={`Delete this ${noun}`} danger onClick={() => onChange(ops.remove(i))}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
            <div className="p-4">
              <FieldEditor value={item} onChange={(next) => onChange(list.map((v, k) => (k === i ? next : v)))} shape={shape} name="" />
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...list, blankItem(shape, list)])}
        className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/15 py-2.5 text-[13.5px] font-medium text-muted transition-colors hover:border-[#ff7a1a]/60 hover:text-fg"
      >
        <Plus className="size-4" /> Add {noun}
      </button>
    </div>
  );
}
