import { articles } from "@/content/articles";
import { copy } from "@/content/copy";
import { education, jobs } from "@/content/experience";
import { highlights } from "@/content/highlights";
import { milestones } from "@/content/milestones";
import { projects } from "@/content/projects";
import { nav, site } from "@/content/site";
import { tech } from "@/content/tech";

/**
 * What the site shows before you edit anything: the files in content/.
 * Each top-level key is one "section" that the editor saves as a whole.
 */
export const defaults = {
  site,
  nav,
  copy,
  projects,
  tech,
  milestones,
  jobs,
  education,
  highlights,
  articles,
};

export type Content = typeof defaults;
export type ContentKey = keyof Content;
export const CONTENT_KEYS = Object.keys(defaults) as ContentKey[];

export const isContentKey = (key: unknown): key is ContentKey =>
  typeof key === "string" && (CONTENT_KEYS as string[]).includes(key);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Saved values win; keys the code added later still come from the defaults. */
function merge(base: unknown, saved: unknown): unknown {
  if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
  if (isObject(base)) {
    if (!isObject(saved)) return base;
    const out: Record<string, unknown> = { ...saved };
    for (const key of Object.keys(base)) out[key] = key in saved ? merge(base[key], saved[key]) : base[key];
    return out;
  }
  return saved === undefined || saved === null || typeof saved !== typeof base ? base : saved;
}

export function mergeContent(saved: Record<string, unknown>): Content {
  const out = {} as Record<ContentKey, unknown>;
  for (const key of CONTENT_KEYS) out[key] = key in saved ? merge(defaults[key], saved[key]) : defaults[key];
  return out as Content;
}
