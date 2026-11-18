"use client";

import { usePathname } from "next/navigation";
import { lazy, Suspense, useSyncExternalStore } from "react";

const AdminTools = lazy(() => import("@/components/admin/admin-tools"));

const noop = () => () => {};
const loggedIn = () => document.cookie.split("; ").includes("admin_ui=1");

/**
 * Loads the editor only for you: visitors never download it. The cookie it
 * checks only says "show the tools"; every save is checked on the server.
 */
export function AdminLoader() {
  usePathname(); // check again after logging in or out
  const admin = useSyncExternalStore(noop, loggedIn, () => false);
  if (!admin) return null;
  return (
    <Suspense fallback={null}>
      <AdminTools />
    </Suspense>
  );
}
