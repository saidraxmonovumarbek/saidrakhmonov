"use client";

import { Clock } from "lucide-react";
import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 10_000);
  return () => clearInterval(id);
}

/** A small live clock showing the current time where you live. */
export function LocalTime({ timeZone, className = "" }: { timeZone: string; className?: string }) {
  const time = useSyncExternalStore(
    subscribe,
    () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
        timeZoneName: "short",
      }).format(new Date()),
    () => null,
  );

  return (
    <span
      className={`items-center gap-1.5 text-sm text-soft tabular-nums ${className}`}
      title={`Local time in ${timeZone.split("/").pop()?.replace(/_/g, " ")}`}
    >
      <Clock className="size-4" />
      <span className="min-w-[4.5ch]">{time ?? "--:--"}</span>
    </span>
  );
}
