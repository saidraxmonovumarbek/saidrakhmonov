"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { ArticleSource } from "@/content/articles";
import { checkPassword, endSession, isAdmin, passwordConfigured, startSession } from "@/lib/auth";
import { CONTENT_TAG } from "@/lib/content";
import { defaults, isContentKey, mergeContent, type Content, type ContentKey } from "@/lib/content-defaults";
import { deleteContent, readContent, writeContent } from "@/lib/store";

export type Result = { ok: true } | { ok: false; error: string };

const NOT_ADMIN: Result = { ok: false, error: "You are logged out. Log in again at /admin." };
const MAX_BYTES = 900_000;

function failure(error: unknown): Result {
  if (error instanceof Error && error.message === "NO_DATABASE") {
    return { ok: false, error: "No database is connected yet. In Vercel, open Storage → Neon and connect it to this project." };
  }
  console.error(error);
  return { ok: false, error: "Could not save. Check your connection and try again." };
}

// ---------------------------------------------------------------------------
// Login

export async function login(_: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  if (!passwordConfigured()) {
    return { error: "No password is set yet. Add ADMIN_PASSWORD to the environment variables, then redeploy." };
  }
  if (!checkPassword(String(form.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return { error: "That password is not right." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Reading (fresh from the database, not the page cache)

export async function loadContent(): Promise<Content | null> {
  if (!(await isAdmin())) return null;
  return mergeContent(await readContent().catch(() => ({})));
}

// ---------------------------------------------------------------------------
// Saving

function validSection(key: ContentKey, value: unknown): string | null {
  const base = defaults[key];
  if (Array.isArray(base) !== Array.isArray(value) || typeof value !== "object" || value === null) {
    return "That change has the wrong shape.";
  }
  if (JSON.stringify(value).length > MAX_BYTES) return "That is too much text for one section.";
  if (key === "articles") {
    const slugs = new Set<string>();
    for (const a of value as ArticleSource[]) {
      if (!a || typeof a.slug !== "string" || !/^[a-z0-9-]+$/.test(a.slug)) return "Every article needs a slug made of letters, numbers and dashes.";
      if (slugs.has(a.slug)) return `Two articles share the slug “${a.slug}”.`;
      slugs.add(a.slug);
    }
  }
  return null;
}

/** Replace one whole section (e.g. all projects) with an edited copy. */
export async function saveSection(key: string, value: unknown): Promise<Result> {
  if (!(await isAdmin())) return NOT_ADMIN;
  if (!isContentKey(key)) return { ok: false, error: "Unknown section." };
  const problem = validSection(key, value);
  if (problem) return { ok: false, error: problem };
  try {
    await writeContent(key, value);
  } catch (error) {
    return failure(error);
  }
  updateTag(CONTENT_TAG);
  return { ok: true };
}

/** Go back to the original text from the content/ files. */
export async function resetSection(key: string): Promise<Result> {
  if (!(await isAdmin())) return NOT_ADMIN;
  if (!isContentKey(key)) return { ok: false, error: "Unknown section." };
  try {
    await deleteContent(key);
  } catch (error) {
    return failure(error);
  }
  updateTag(CONTENT_TAG);
  return { ok: true };
}
