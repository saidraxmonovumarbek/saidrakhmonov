/**
 * Addresses into the content, used by the on-page editor.
 *
 * Elements on the page carry `data-edit="<path>"`, e.g.
 *   site.about.2           third line of the About text
 *   projects.slug=fokus.title
 *                          the title of the project whose slug is "fokus"
 * A `key=value` step picks the item of a list by a field, so the address
 * stays right when the page shows a filtered or sorted list.
 */

export type Step = string | number;

/** Build a path from parts, e.g. edit("projects", by("slug", p.slug), "title"). */
export function edit(...parts: Array<string | number>): string {
  return parts.join(".");
}
export const by = (field: string, value: string) => `${field}=${value}`;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** Turn a data-edit address into concrete steps (array indexes and keys). Null if it points nowhere. */
export function resolve(root: unknown, address: string): Step[] | null {
  const steps: Step[] = [];
  let node: unknown = root;
  for (const raw of address.split(".")) {
    if (Array.isArray(node)) {
      let index: number;
      const eq = raw.indexOf("=");
      if (eq > 0) {
        const field = raw.slice(0, eq);
        const value = raw.slice(eq + 1);
        index = node.findIndex((item) => isRecord(item) && String(item[field]) === value);
      } else {
        index = Number(raw);
      }
      if (!Number.isInteger(index) || index < 0 || index >= node.length) return null;
      steps.push(index);
      node = node[index];
    } else if (isRecord(node)) {
      steps.push(raw);
      node = node[raw];
    } else {
      return null;
    }
  }
  return steps;
}

export function getAt(root: unknown, steps: Step[]): unknown {
  let node: unknown = root;
  for (const step of steps) {
    if (!isRecord(node)) return undefined;
    node = (node as Record<string | number, unknown>)[step];
  }
  return node;
}

/** A copy of `root` with the value at `steps` replaced. */
export function setAt<T>(root: T, steps: Step[], value: unknown): T {
  if (steps.length === 0) return value as T;
  const [head, ...rest] = steps;
  const node = root as unknown;
  if (Array.isArray(node)) {
    const copy = [...node];
    copy[head as number] = setAt(copy[head as number], rest, value);
    return copy as T;
  }
  const record = (isRecord(node) ? node : {}) as Record<string, unknown>;
  return { ...record, [head]: setAt(record[head as string], rest, value) } as T;
}

/** The deepest list that contains the addressed value: its path and the item's index. */
export function parentList(steps: Step[]): { list: Step[]; index: number; item: Step[] } | null {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (typeof steps[i] === "number") {
      return { list: steps.slice(0, i), index: steps[i] as number, item: steps.slice(0, i + 1) };
    }
  }
  return null;
}

/** "projects.0.cover" → "projects.cover": the shape of a path, without indexes. */
export const shapeOf = (steps: Step[]) => steps.filter((s) => typeof s === "string").join(".");
