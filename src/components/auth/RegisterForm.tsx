"use client";

import { useActionState } from "react";
import { register, type AuthFormState } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    register,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <Input
        name="name"
        label="ชื่อของคุณ"
        placeholder="เช่น สมชาย ใจดี"
        autoComplete="name"
        required
      />
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
        hint="อย่างน้อย 8 ตัวอักษร"
        autoComplete="new-password"
        required
      />
      {state.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "กำลังสมัคร…" : "สมัครใช้งานฟรี"}
      </Button>
    </form>
  );
}
