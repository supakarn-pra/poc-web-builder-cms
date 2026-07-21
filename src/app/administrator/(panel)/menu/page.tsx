import Link from "next/link";
import { Topbar } from "@/components/admin/Topbar";
import {
  ChromeManager,
  type ChromeValues,
} from "@/components/chrome/ChromeManager";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseFooterRow, parseHeaderRow } from "@/lib/serialize";
import { t } from "@/lib/messages";
import type {
  NavbarProps,
  SiteFooterProps,
} from "@/lib/page/components/registry";
import type { ComponentType, RowInstance } from "@/lib/page/types";

export const metadata = { title: "ส่วนหัว/ส่วนท้าย" };

/** props ของ component ตัวแรกตาม type — null = ไม่มี component นั้นในแถว */
function readProps<P>(row: RowInstance, type: ComponentType): P | null {
  for (const col of row.columns) {
    for (const comp of col.components) {
      if (comp.type === type) return comp.props as P;
    }
  }
  return null;
}

export default async function SiteChromePage() {
  const user = await requireUser();
  const website = await db.website.findFirst({
    where: { parentId: null, ...(user.role === "ADMIN" ? {} : { ownerId: user.id }) }, // เมนู CMS อิงเว็บหลักเสมอ (landing ไม่แย่ง context)
    orderBy: { updatedAt: "desc" },
    include: {
      pages: {
        select: { id: true, name: true, slug: true, isHome: true },
        orderBy: [{ isHome: "desc" }, { createdAt: "asc" }],
      },
      posts: {
        where: { status: "PUBLISHED" },
        select: { id: true, title: true },
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  if (!website) {
    return (
      <>
        <Topbar title={t.nav.menu} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-text-muted">
            สร้างเว็บไซต์ก่อน แล้วค่อยแก้ส่วนหัว/ส่วนท้าย
          </p>
          <Link href="/administrator/websites/new">
            <Button>{t.action.createWebsite}</Button>
          </Link>
        </div>
      </>
    );
  }

  const navbar = readProps<NavbarProps>(
    parseHeaderRow(website.headerRow),
    "navbar",
  );
  const siteFooter = readProps<SiteFooterProps>(
    parseFooterRow(website.footerRow),
    "siteFooter",
  );

  const initial: ChromeValues = {
    headerBrand: navbar?.brandName ?? website.name,
    ctaLabel: navbar?.ctaLabel ?? "",
    ctaHref: navbar?.ctaHref ?? "",
    mainLinks: navbar?.links ?? [],
    footerBrand: siteFooter?.brandName ?? website.name,
    footerDescription: siteFooter?.description ?? "",
    footerCopyright: siteFooter?.copyright ?? "",
    footerLinks: siteFooter?.links ?? [],
  };

  return (
    <>
      <Topbar title={t.nav.menu} websiteName={website.name} />
      <div className="flex-1 p-6">
        <p className="mb-4 max-w-3xl text-sm text-text-muted">
          ส่วนหัวและส่วนท้ายแสดงเหมือนกันทุกหน้า — แก้ชื่อแบรนด์ เมนู
          และปุ่มได้ที่นี่ หรือกด &quot;แก้แบบเต็มจอ&quot;
          เพื่อจัดวางอิสระใน builder
        </p>
        <ChromeManager
          websiteId={website.id}
          pages={website.pages}
          posts={website.posts}
          initial={initial}
          hasNavbar={navbar !== null}
          hasFooter={siteFooter !== null}
        />
      </div>
    </>
  );
}
