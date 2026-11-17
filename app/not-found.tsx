import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div data-panel className="card mt-6 px-6 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.18em] text-lilac">404</p>
      <h1 className="mt-4 text-6xl font-medium tracking-[-0.05em]">Lost in the current</h1>
      <p className="mx-auto mt-4 max-w-sm text-muted">
        This page does not exist, or it drifted off. Let&apos;s get you back.
      </p>
      <Link
        href="/"
        className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#0c0915]"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Back home
      </Link>
    </div>
  );
}
