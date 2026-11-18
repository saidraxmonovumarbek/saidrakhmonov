"use client";

import { Eye } from "lucide-react";
import { useEffect, useState } from "react";

const ID_KEY = "visitor-id";

function visitorId(): string | null {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * How many people have visited the site: each browser counts once, through
 * an anonymous random id. Your own visits as admin are not counted.
 */
export function ViewCount({ className }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const admin = document.cookie.split("; ").includes("admin_ui=1");
    let cancelled = false;
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: admin ? null : visitorId() }),
      keepalive: true,
    })
      .then((r) => r.json() as Promise<{ count: number | null }>)
      .then((data) => {
        if (!cancelled && typeof data.count === "number" && data.count > 0) setCount(data.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null) return null;
  const text = count.toLocaleString("en-US");
  return (
    <span
      className={className}
      title={`${text} ${count === 1 ? "person has" : "people have"} visited this site`}
      aria-label={`${text} visitors`}
    >
      <Eye className="size-4" aria-hidden />
      {text}
    </span>
  );
}
