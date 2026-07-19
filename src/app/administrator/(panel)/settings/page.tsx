import Link from "next/link";
import { Topbar } from "@/components/admin/Topbar";
import { GlobalStyleForm } from "@/components/settings/GlobalStyleForm";
import { CustomDomainForm } from "@/components/settings/CustomDomainForm";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseGlobalStyle } from "@/lib/serialize";

export const metadata = { title: "ตั้งค่า" };

export default async function SettingsPage() {
  const user = await requireUser();
  const website = await db.website.findFirst({
    where: { parentId: null, ...(user.role === "ADMIN" ? {} : { ownerId: user.id }) }, // เมนู CMS อิงเว็บหลักเสมอ (landing ไม่แย่ง context)
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      globalStyle: true,
      customDomain: true,
    },
  });

  if (!website) {
    return (
      <>
        <Topbar title="ตั้งค่า" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-text-muted">สร้างเว็บไซต์ก่อน แล้วค่อยตั้งค่ารูปแบบ</p>
          <Link href="/administrator/websites/new">
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
        <CustomDomainForm
          websiteId={website.id}
          customDomain={website.customDomain}
        />
      </div>
    </>
  );
}
