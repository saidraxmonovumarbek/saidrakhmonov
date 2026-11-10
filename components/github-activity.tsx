import { ArrowUpRight } from "lucide-react";
import { InView } from "@/components/in-view";
import { Section } from "@/components/section";
import { site } from "@/content/site";
import { getContributions } from "@/lib/github";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SHADE = [7, 26, 46, 68, 92];
const shade = (level: number) => `color-mix(in srgb, var(--fg) ${SHADE[level]}%, var(--bg))`;

function label(day: { date: string; count: number | null }) {
  const date = new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  if (day.count == null) return date;
  return `${day.count} contribution${day.count === 1 ? "" : "s"} on ${date}`;
}

export async function GithubActivity() {
  const data = await getContributions(site.githubUsername);
  const weeks = data.weeks;
  const columns = { gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` };

  // one month label above the first week of each month
  const labels: { col: number; text: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const first = week.find(Boolean);
    if (!first) return;
    const month = Number(first.date.slice(5, 7)) - 1;
    if (month !== lastMonth) {
      if (labels.length === 0 || col - labels[labels.length - 1].col >= 3)
        labels.push({ col, text: MONTHS[month] });
      lastMonth = month;
    }
  });

  return (
    <Section
      id="activity"
      title="GitHub Activity"
      action={
        <a
          href={`https://github.com/${site.githubUsername}`}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-1 pb-1 text-[15px] text-muted transition-colors hover:text-fg"
        >
          @{site.githubUsername}
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      }
    >
      <div className="overflow-x-auto pb-1">
        <InView className="contrib min-w-[640px]">
          <div className="mb-2 grid gap-[3px] text-[13px] text-muted" style={columns} aria-hidden>
            {labels.map((l) => (
              <span key={l.col} style={{ gridColumnStart: l.col + 1 }} className="whitespace-nowrap">
                {l.text}
              </span>
            ))}
          </div>
          <div
            role="img"
            aria-label={
              data.total != null
                ? `${data.total} GitHub contributions in the last year`
                : "GitHub contribution calendar"
            }
            className="grid grid-flow-col grid-rows-7 gap-[3px]"
            style={columns}
          >
            {weeks.map((week, col) =>
              Array.from({ length: 7 }, (_, row) => {
                const day = week[row] ?? null;
                return day ? (
                  <span
                    key={day.date}
                    title={label(day)}
                    className="contrib-cell aspect-square rounded-[2.5px]"
                    style={
                      {
                        background: shade(day.level),
                        "--col": col,
                        "--row": row,
                      } as React.CSSProperties
                    }
                  />
                ) : (
                  <span key={`${col}-${row}`} />
                );
              }),
            )}
          </div>
        </InView>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <p>
          {data.ok
            ? data.total != null
              ? `${data.total.toLocaleString("en-US")} contributions in the last year`
              : "Contributions in the last year"
            : "Could not reach GitHub just now. The graph fills in on the next refresh."}
        </p>
        <p className="flex items-center gap-1.5" aria-hidden>
          Less
          {SHADE.map((_, level) => (
            <span key={level} className="size-2.5 rounded-[2.5px]" style={{ background: shade(level) }} />
          ))}
          More
        </p>
      </div>
    </Section>
  );
}
