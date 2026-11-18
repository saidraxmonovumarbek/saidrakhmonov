import { TECH_ICON_KEYS } from "@/components/tech-icon";
import { techCategories } from "@/content/tech";
import type { ContentKey } from "@/lib/content-defaults";

/**
 * What the editor needs to know about the content beyond the values
 * themselves: blank items for "Add", choices for fixed fields, and labels.
 * Keys are path shapes without indexes, e.g. "projects" or "site.contact".
 */

const YEAR = new Date().getFullYear();

/** A new, empty item for each list. */
export const TEMPLATES: Record<string, unknown> = {
  projects: {
    slug: "new-project",
    title: "New project",
    tagline: "One line about it.",
    description: "What it is, who it is for, and what you learned building it.",
    tags: [],
    status: "Building",
    year: YEAR,
    featured: false,
    links: { live: "", repo: "" },
    image: "",
    cover: { from: "#ddd6fe", to: "#7c3aed", headline: "A new\nproject.", accent: "#6d28d9", ribbon: "" },
  },
  tech: { name: "New tool", icon: "", category: "Tools" },
  milestones: { date: "", year: YEAR, title: "New milestone", text: "", tag: "", href: "" },
  jobs: { role: "Role", company: "Company", href: "", location: "", period: `${YEAR} — Present`, points: [], tags: [] },
  education: { degree: "Degree", school: "School", period: "", note: "" },
  highlights: { name: "Name", handle: "@handle", quote: "Something kind.", href: "", avatar: "", verified: false },
  "site.contact": { label: "Link", icon: "link", href: "https://" },
  "nav.main": { label: "Page", href: "/" },
  "nav.more": { label: "Page", href: "/", note: "" },
};

/** Fixed choices, shown as a dropdown. */
export const OPTIONS: Record<string, readonly string[]> = {
  "projects.status": ["Live", "Building", "Archived"],
  "tech.category": techCategories,
  "tech.icon": TECH_ICON_KEYS,
  "site.contact.icon": ["github", "linkedin", "telegram", "x", "instagram", "mail", "resume", "link"],
};

/** Fields that are simply left out when empty. */
export const OPTIONAL = new Set(["href", "image", "ribbon", "tag", "note", "avatar", "live", "repo"]);

/** Fields that get a big text box. */
export const LONG = new Set(["description", "text", "quote", "summary", "note", "headline"]);

/** Help shown under a field. */
export const HINTS: Record<string, string> = {
  "projects.slug": "Short id, letters and dashes only.",
  "projects.featured": "Featured projects show on the home page (first four).",
  "projects.image": "Optional screenshot in /public, e.g. /projects/app.png. Empty draws the cover.",
  "projects.cover.headline": "A new line starts the second, coloured line.",
  "projects.cover.ribbon": "Optional ribbon across the corner, e.g. 800+ users.",
  "milestones.year": "Milestones are grouped by this year.",
  "highlights.avatar": "Optional image in /public. Empty shows the first letter.",
  "site.contact.href": "A full link (https://…) or mailto:you@example.com",
  "site.about": "Wrap words in **double stars** to make them bold.",
  "milestones.text": "Wrap words in **double stars** to make them bold.",
  "site.timeZone": "e.g. Asia/Tashkent",
};

/** Human names for lists, used in the editor. */
export const LIST_NAMES: Record<string, string> = {
  projects: "project",
  tech: "tech chip",
  milestones: "milestone",
  jobs: "job",
  education: "school",
  highlights: "highlight",
  articles: "article",
  "site.contact": "contact link",
  "site.about": "line",
  "site.roles": "role",
  "nav.main": "menu link",
  "nav.more": "menu link",
  "projects.tags": "tag",
  "jobs.points": "point",
  "jobs.tags": "tag",
  "articles.tags": "tag",
};

/** The sections on the dashboard, in order. */
export const SECTIONS: { key: ContentKey; title: string; note: string }[] = [
  { key: "site", title: "About you", note: "Name, location, bio, contact links, call to action, quote" },
  { key: "copy", title: "Page text", note: "Section titles, page intros, button labels" },
  { key: "projects", title: "Projects", note: "Cards on the home page and /projects" },
  { key: "tech", title: "Tech stack", note: "Chips on the home page" },
  { key: "milestones", title: "Milestones", note: "The timeline on /milestones" },
  { key: "jobs", title: "Work", note: "Jobs on /experience" },
  { key: "education", title: "Education", note: "Schools on /experience" },
  { key: "highlights", title: "Highlights", note: "Kind words on the home page (empty hides the section)" },
  { key: "nav", title: "Menu", note: "Links in the top bar and footer" },
];

export function labelFor(field: string) {
  const words = field.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A new item for the list at this shape, made unique against its siblings. */
export function blankItem(shape: string, siblings: unknown[]): unknown {
  const template = TEMPLATES[shape];
  if (template === undefined) {
    const first = siblings[0];
    if (typeof first === "string" || first === undefined) return "New";
    if (typeof first === "number") return 0;
    return structuredClone(first);
  }
  return uniquify(structuredClone(template), siblings);
}

/** Keep slugs (and tech names) unique when an item is added or duplicated. */
export function uniquify(item: unknown, siblings: unknown[]): unknown {
  if (typeof item !== "object" || item === null) return item;
  const record = item as Record<string, unknown>;
  for (const field of ["slug", "name"] as const) {
    if (typeof record[field] !== "string") continue;
    const taken = new Set(siblings.map((s) => (s as Record<string, unknown>)?.[field]));
    let value = record[field] as string;
    const base = value.replace(/[- ]copy(-\d+)?$/, "");
    for (let n = 1; taken.has(value); n++) value = field === "slug" ? `${base}-copy${n > 1 ? `-${n}` : ""}` : `${base} copy${n > 1 ? ` ${n}` : ""}`;
    record[field] = value;
  }
  return record;
}

/** Drop empty optional fields before saving. */
export function tidy(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(tidy);
  if (typeof value !== "object" || value === null) return value;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (OPTIONAL.has(key) && (v === "" || v === undefined)) continue;
    out[key] = tidy(v);
  }
  return out;
}

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled"
  );
}
