import Link from "next/link";
import { Topbar } from "@/components/admin/Topbar";
import { PopupsManager } from "@/components/popups/PopupsManager";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { t } from "@/lib/messages";

export const metadata = { title: "Pop-up" };

export default async function PopupsPage() {
  const user = await requireUser();
  const website = await db.website.findFirst({
    where: { parentId: null, ...(user.role === "ADMIN" ? {} : { ownerId: user.id }) }, // เมนู CMS อิงเว็บหลักเสมอ (landing ไม่แย่ง context)
    orderBy: { updatedAt: "desc" },
    include: {
      pages: {
        select: { id: true, name: true, isHome: true },
        orderBy: [{ isHome: "desc" }, { createdAt: "asc" }],
      },
      popups: {
        orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!website) {
    return (
      <>
        <Topbar title={t.nav.popups} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-text-muted">สร้างเว็บไซต์ก่อน แล้วค่อยสร้าง Pop-up</p>
          <Link href="/administrator/websites/new">
            <Button>{t.action.createWebsite}</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title={t.nav.popups} websiteName={website.name} />
      <div className="flex-1 p-6">
        <PopupsManager
          websiteId={website.id}
          pages={website.pages}
          popups={website.popups.map((p) => ({
            id: p.id,
            title: p.title,
            text: p.text,
            imageUrl: p.imageUrl,
            pageIds: p.pageIds,
            sortIndex: p.sortIndex,
            enabled: p.enabled,
          }))}
        />
      </div>
    </>
  );
}
