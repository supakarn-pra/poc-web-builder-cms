import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/messages";

/** แสดงที่ root เมื่อยังไม่มีเว็บไซต์ที่ตั้งเป็นสาธารณะ */
export function DefaultLanding() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-muted px-6 text-center">
      <div className="max-w-lg space-y-3">
        <p className="text-sm font-medium text-[color:var(--brand-primary)]">
          {t.app.name}
        </p>
        <h1 className="font-display text-4xl font-semibold">
          ยังไม่มีเว็บไซต์ที่เผยแพร่
        </h1>
        <p className="text-text-muted">
          เข้าไปที่ระบบจัดการเพื่อสร้างเว็บไซต์ แล้วเลือก “ใช้เวอร์ชันนี้เป็นเว็บจริง”
          เว็บของคุณจะแสดงที่หน้านี้ทันที
        </p>
      </div>
      <Link href="/administrator/websites">
        <Button size="lg">ไปที่ระบบจัดการ</Button>
      </Link>
    </div>
  );
}
