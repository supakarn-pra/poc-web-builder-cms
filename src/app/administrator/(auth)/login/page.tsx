import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/messages";

export const metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/administrator/dashboard");

  return (
    <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-surface p-8 shadow-[var(--shadow-md)]">
      <div className="text-center space-y-1">
        <h1 className="font-display text-2xl font-semibold">{t.app.name}</h1>
        <p className="text-sm text-text-muted">{t.app.tagline}</p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-text-muted">
        ยังไม่มีบัญชี?{" "}
        <Link
          href="/administrator/register"
          className="text-[color:var(--brand-primary)] hover:underline"
        >
          สมัครใช้งานฟรี
        </Link>
      </p>
    </div>
  );
}
