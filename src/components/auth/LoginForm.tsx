"use client";

import { useActionState } from "react";
import { login, type AuthFormState } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { t } from "@/lib/messages";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    login,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="อีเมล"
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <Input
        name="password"
        type="password"
        label="รหัสผ่าน"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />
      {state.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "กำลังเข้าสู่ระบบ…" : t.action.login}
      </Button>
    </form>
  );
}
