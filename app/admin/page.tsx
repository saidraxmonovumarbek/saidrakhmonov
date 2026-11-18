import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Dashboard } from "@/components/admin/dashboard";
import { LoginForm } from "@/components/admin/login-form";
import { isAdmin, OWNER_EMAIL, passwordConfigured } from "@/lib/auth";
import { hasDatabase, visitorStats } from "@/lib/store";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <Suspense fallback={<div data-panel className="card mt-6 h-64 animate-pulse" aria-busy="true" />}>
      <Gate />
    </Suspense>
  );
}

/** The login form for everyone, the dashboard for you. */
async function Gate() {
  await connection(); // always at request time: env and cookies are read per visit
  if (!(await isAdmin())) {
    return (
      <div data-panel className="card mt-6 px-5 py-16 sm:px-7">
        <LoginForm configured={passwordConfigured()} />
      </div>
    );
  }
  const stats = await visitorStats().catch(() => null);
  const database = hasDatabase() ? "ok" : process.env.VERCEL ? "missing" : "local";
  return <Dashboard stats={stats} email={OWNER_EMAIL} database={database} />;
}
