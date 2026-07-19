import Link from "next/link";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/Button";
import { WebsiteTree, type TreeSite } from "@/components/websites/WebsiteTree";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { t } from "@/lib/messages";

export const metadata = { title: "เว็บไซต์" };

const pageSelect = {
  id: true,
  name: true,
  slug: true,
  isHome: true,
  status: true,
} as const;

const pageOrder = [{ isHome: "desc" as const }, { createdAt: "asc" as const }];

export default async function WebsitesListPage() {
  const user = await requireUser();

  // โหลดเฉพาะเว็บหลัก (parentId = null) พร้อมโดเมนย่อย 1 ระดับ
  const mainSites = await db.website.findMany({
    where: {
      parentId: null,
      ...(user.role === "ADMIN" ? {} : { ownerId: user.id }),
    },
    orderBy: { createdAt: "asc" },
    include: {
      pages: { select: pageSelect, orderBy: pageOrder },
      children: {
        orderBy: { createdAt: "asc" },
        include: { pages: { select: pageSelect, orderBy: pageOrder } },
      },
    },
  });

  const sites: TreeSite[] = mainSites.map((s) => ({
    id: s.id,
    name: s.name,
    subdomain: s.subdomain,
    status: s.status,
    isPublic: s.isPublic,
    pages: s.pages,
    children: s.children.map((c) => ({
      id: c.id,
      name: c.name,
      subdomain: c.subdomain,
      status: c.status,
      isPublic: c.isPublic,
      pages: c.pages,
      children: [],
    })),
  }));

  return (
    <>
      <Topbar
        title={t.nav.websites}
        actions={
          <Link href="/administrator/websites/new">
            <Button variant="primary">
              <Plus size={16} /> {t.action.createWebsite}
            </Button>
          </Link>
        }
      />
      <div className="p-6 flex-1">
        {sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border-strong bg-surface p-16 text-center">
            <p className="text-text-muted">
              ยังไม่มีเว็บไซต์ — สร้างเว็บไซต์แรกของคุณเลย
            </p>
            <Link href="/administrator/websites/new">
              <Button>
                <Plus size={16} /> {t.action.createWebsite}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-text-muted">
              คลิกที่เว็บไซต์เพื่อดูหน้าทั้งหมด ส่วนหัว/ส่วนท้าย และโดเมนย่อย
            </p>
            <WebsiteTree sites={sites} />
          </>
        )}
      </div>
    </>
  );
}
