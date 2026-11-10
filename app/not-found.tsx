import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-6 py-28 text-center">
      <p className="font-mono text-xs tracking-wider text-soft">( 404 )</p>
      <h1 className="mt-3 font-serif text-6xl tracking-tight">Lost in the woods</h1>
      <p className="mx-auto mt-4 max-w-sm text-muted">
        This page does not exist, or it wandered off. Let&apos;s get you back to the trail.
      </p>
      <Link
        href="/"
        className="group mt-8 inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3 font-semibold text-bg"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Back home
      </Link>
    </div>
  );
}
