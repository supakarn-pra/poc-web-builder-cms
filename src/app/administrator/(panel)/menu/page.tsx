import Link from "next/link";
import { Topbar } from "@/components/admin/Topbar";
import { MenuManager, type MenuLink } from "@/components/menu/MenuManager";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseFooterRow, parseHeaderRow } from "@/lib/serialize";
import { t } from "@/lib/messages";
import type { ComponentType, RowInstance } from "@/lib/page/types";

export const metadata = { title: "เมนูเว็บไซต์" };

/** ดึง links ของ component ตัวแรกตาม type — null = ไม่มี component นั้นในแถว */
function readLinks(row: RowInstance, type: ComponentType): MenuLink[] | null {
  for (const col of row.columns) {
    for (const comp of col.components) {
      if (comp.type === type) {
        const links = (comp.props as { links?: MenuLink[] }).links;
        return Array.isArray(links) ? links : [];
      }
    }
  }
  return null;
}

export default async function NavigationMenuPage() {
  const user = await requireUser();
  const website = await db.website.findFirst({
    where: { parentId: null, ...(user.role === "ADMIN" ? {} : { ownerId: user.id }) }, // เมนู CMS อิงเว็บหลักเสมอ (landing ไม่แย่ง context)
    orderBy: { updatedAt: "desc" },
    include: {
      pages: {
        select: { id: true, name: true, slug: true, isHome: true },
        orderBy: [{ isHome: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!website) {
    return (
      <>
        <Topbar title={t.nav.menu} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-text-muted">สร้างเว็บไซต์ก่อน แล้วค่อยจัดการเมนู</p>
          <Link href="/administrator/websites/new">
            <Button>{t.action.createWebsite}</Button>
          </Link>
        </div>
      </>
    );
  }

  const header = parseHeaderRow(website.headerRow);
  const footer = parseFooterRow(website.footerRow);
  const mainLinks = readLinks(header, "navbar");
  const footerLinks = readLinks(footer, "siteFooter");

  return (
    <>
      <Topbar title={t.nav.menu} websiteName={website.name} />
      <div className="flex-1 p-6">
        <MenuManager
          websiteId={website.id}
          pages={website.pages}
          initialMain={mainLinks ?? []}
          initialFooter={footerLinks ?? []}
          hasNavbar={mainLinks !== null}
          hasFooter={footerLinks !== null}
        />
      </div>
    </>
  );
}
