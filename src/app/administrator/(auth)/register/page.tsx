import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/messages";

export const metadata = { title: "สมัครใช้งาน" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/administrator/dashboard");

  return (
    <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-surface p-8 shadow-[var(--shadow-md)]">
      <div className="text-center space-y-1">
        <h1 className="font-display text-2xl font-semibold">{t.app.name}</h1>
        <p className="text-sm text-text-muted">
          สมัครแล้วสร้างเว็บไซต์แรกได้เลยใน 30 นาที
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-text-muted">
        มีบัญชีอยู่แล้ว?{" "}
        <Link
          href="/administrator/login"
          className="text-[color:var(--brand-primary)] hover:underline"
        >
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
