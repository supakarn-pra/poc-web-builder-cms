import Link from "next/link";
import { Topbar } from "@/components/admin/Topbar";
import { GlobalStyleForm } from "@/components/settings/GlobalStyleForm";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseGlobalStyle } from "@/lib/serialize";

export const metadata = { title: "ตั้งค่า" };

export default async function SettingsPage() {
  const user = await requireUser();
  const website = await db.website.findFirst({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, globalStyle: true, subdomain: true },
  });

  if (!website) {
    return (
      <>
        <Topbar title="ตั้งค่า" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-text-muted">สร้างเว็บไซต์ก่อน แล้วค่อยตั้งค่ารูปแบบ</p>
          <Link href="/admin/websites/new">
            <Button>สร้างเว็บไซต์</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="ตั้งค่า" websiteName={website.name} />
      <div className="flex-1 p-6 space-y-8">
        <GlobalStyleForm
          websiteId={website.id}
          websiteName={website.name}
          style={parseGlobalStyle(website.globalStyle)}
        />
        <div className="max-w-xl rounded-lg border border-dashed border-border-strong p-5 text-sm text-text-muted">
          <p className="font-medium text-text">โดเมนที่กำหนดเอง</p>
          <p className="mt-1">
            เชื่อม {website.subdomain}.platform.com เข้ากับโดเมนของคุณเอง — มาใน
            Sprint 5
          </p>
        </div>
      </div>
    </>
  );
}
