"use client";

import { LockKeyhole } from "lucide-react";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { inputClass } from "@/components/admin/fields";
import { buttonClass, ErrorText } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="mx-auto max-w-sm space-y-4">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/12 bg-white/[0.05] text-lilac">
        <LockKeyhole className="size-5" />
      </span>
      <div className="text-center">
        <h1 className="text-3xl font-medium tracking-[-0.03em]">Admin</h1>
        <p className="mt-1.5 text-[15px] text-muted">Only for the owner of this site.</p>
      </div>
      {!configured && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[13px] text-amber-100">
          No password is set yet. Add <code>ADMIN_PASSWORD</code> in Vercel → Settings → Environment Variables, then redeploy.
        </p>
      )}
      <div>
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          required
          autoFocus
          className={cn(inputClass, "py-2.5 text-[15px]")}
        />
      </div>
      <ErrorText>{state?.error}</ErrorText>
      <button type="submit" className={cn(buttonClass.primary, "w-full py-2.5 text-[15px]")} disabled={pending}>
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
