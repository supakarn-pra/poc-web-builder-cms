import Link from "next/link";
import { Topbar } from "@/components/admin/Topbar";
import { PagesManager } from "@/components/pages/PagesManager";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "หน้าเว็บ" };

export default async function PagesPage() {
  const user = await requireUser();
  const website = await db.website.findFirst({
    where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      pages: {
        orderBy: [{ isHome: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          isHome: true,
          status: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!website) {
    return (
      <>
        <Topbar title="หน้าเว็บ" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-text-muted">สร้างเว็บไซต์ก่อน แล้วค่อยจัดการหน้า</p>
          <Link href="/admin/websites/new">
            <Button>สร้างเว็บไซต์</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="หน้าเว็บ" websiteName={website.name} />
      <div className="flex-1 p-6">
        <PagesManager
          websiteId={website.id}
          pages={website.pages.map((p) => ({
            ...p,
            updatedAt: p.updatedAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}
