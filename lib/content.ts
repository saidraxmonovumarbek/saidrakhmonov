import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { mergeContent, type Content } from "@/lib/content-defaults";
import { hasDatabase, readContent } from "@/lib/store";

export const CONTENT_TAG = "content";

/**
 * Everything the site shows: the defaults from content/ with your saved edits
 * on top. Cached and shared by every page; saving an edit refreshes it at once
 * (updateTag), and it rechecks the database at most once a minute anyway.
 */
export async function getContent(): Promise<Content> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("minutes");

  let saved: Record<string, unknown> = {};
  try {
    saved = await readContent();
  } catch (error) {
    // with a database configured, failing loudly keeps the last good copy
    // instead of quietly caching the defaults over your edits
    if (hasDatabase()) throw error;
  }
  return mergeContent(saved);
}
