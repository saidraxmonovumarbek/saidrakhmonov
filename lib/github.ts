import { cacheLife } from "next/cache";

/**
 * Loads the public contribution calendar for the GitHub Activity graph.
 *
 * - If a GITHUB_TOKEN environment variable is set, the official GraphQL API
 *   is used (most reliable). Any classic token with no scopes works.
 * - Otherwise the public calendar on github.com is read.
 * - If GitHub cannot be reached, an empty graph is shown instead of an error.
 */

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  level: 0 | 1 | 2 | 3 | 4;
  count: number | null;
}

export interface Contributions {
  ok: boolean;
  total: number | null;
  /** Columns of up to 7 days, Sunday first. */
  weeks: (ContributionDay | null)[][];
}

const LEVELS: Record<string, ContributionDay["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

function toWeeks(days: ContributionDay[]): Contributions["weeks"] {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1));
  const weeks: Contributions["weeks"] = [];
  let week: (ContributionDay | null)[] = [];
  for (const day of sorted) {
    const dow = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    if (week.length === 0) for (let i = 0; i < dow; i++) week.push(null);
    week.push(day);
    if (dow === 6) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push(week);
  return weeks;
}

async function fromGraphQL(user: string, token: string): Promise<Contributions | null> {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: user } }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) return null;
  const days: ContributionDay[] = cal.weeks.flatMap(
    (w: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }) =>
      w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: LEVELS[d.contributionLevel] ?? 0,
      })),
  );
  return { ok: true, total: cal.totalContributions, weeks: toWeeks(days) };
}

/** Parses the HTML of github.com/users/<name>/contributions. */
export function parseCalendarHtml(html: string): Contributions | null {
  const days: ContributionDay[] = [];
  const ids = new Map<string, ContributionDay>();
  for (const [tag] of html.matchAll(/<td\b[^>]*data-date="[^"]+"[^>]*>/g)) {
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    if (!date) continue;
    const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0);
    const day: ContributionDay = {
      date,
      level: Math.min(4, Math.max(0, level)) as ContributionDay["level"],
      count: null,
    };
    days.push(day);
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    if (id) ids.set(id, day);
  }
  if (days.length === 0) return null;

  // Tooltips carry the exact numbers: "5 contributions on March 3rd."
  for (const [, id, text] of html.matchAll(
    /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g,
  )) {
    const day = ids.get(id);
    if (!day) continue;
    const n = text.trim().match(/^(\d[\d,]*|No)\s+contribution/i)?.[1];
    if (n) day.count = n.toLowerCase() === "no" ? 0 : Number(n.replace(/,/g, ""));
  }

  const totalText = html.match(/([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i)?.[1];
  const total = totalText ? Number(totalText.replace(/,/g, "")) : null;
  return { ok: true, total, weeks: toWeeks(days) };
}

async function fromPublicPage(user: string): Promise<Contributions | null> {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(user)}/contributions`, {
    headers: { "X-Requested-With": "XMLHttpRequest", Accept: "text/html" },
  });
  if (!res.ok) return null;
  return parseCalendarHtml(await res.text());
}

function emptyCalendar(): Contributions {
  const today = new Date();
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const days: ContributionDay[] = [];
  const start = end - (52 * 7 + new Date(end).getUTCDay()) * 86_400_000;
  for (let t = start; t <= end; t += 86_400_000) {
    days.push({ date: new Date(t).toISOString().slice(0, 10), level: 0, count: null });
  }
  return { ok: false, total: null, weeks: toWeeks(days) };
}

export async function getContributions(user: string): Promise<Contributions> {
  "use cache";
  cacheLife("hours");

  try {
    const token = process.env.GITHUB_TOKEN;
    const data = token ? await fromGraphQL(user, token) : await fromPublicPage(user);
    if (data) return data;
  } catch {
    // offline or blocked: fall through to the empty graph
  }
  return emptyCalendar();
}
