"use client";

import { useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { loadContent, saveSection, resetSection, type Result } from "@/app/admin/actions";
import type { Content, ContentKey } from "@/lib/content-defaults";

/**
 * Client-side state shared by everything in the editor: the raw content
 * (loaded once from the server), whether edit mode is on, and saving.
 */

type State = { content: Content | null; loading: boolean; editing: boolean };

let state: State = { content: null, loading: false, editing: false };
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
};
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const SERVER: State = { content: null, loading: false, editing: false };

const EDIT_KEY = "admin-editing";

export function setEditing(on: boolean) {
  set({ editing: on });
  document.documentElement.toggleAttribute("data-editing", on);
  try {
    sessionStorage.setItem(EDIT_KEY, on ? "1" : "0");
  } catch {}
}

export function restoreEditing() {
  let on = false;
  try {
    on = sessionStorage.getItem(EDIT_KEY) === "1";
  } catch {}
  setEditing(on);
}

export async function ensureContent(force = false) {
  if ((state.content && !force) || state.loading) return state.content;
  set({ loading: true });
  try {
    const content = await loadContent();
    set({ content, loading: false });
    return content;
  } catch {
    set({ loading: false });
    return null;
  }
}

export function useEditorState() {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

/** Save one section and refresh the page so the change shows everywhere. */
export function useSave() {
  const router = useRouter();
  const save = useCallback(
    async <K extends ContentKey>(key: K, value: Content[K]): Promise<Result> => {
      const result = await saveSection(key, value);
      if (result.ok && state.content) set({ content: { ...state.content, [key]: value } });
      if (result.ok) router.refresh();
      return result;
    },
    [router],
  );
  const reset = useCallback(
    async (key: ContentKey): Promise<Result> => {
      const result = await resetSection(key);
      if (result.ok) {
        await ensureContent(true);
        router.refresh();
      }
      return result;
    },
    [router],
  );
  return { save, reset };
}
