import { notFound } from "next/navigation";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { ChromeShell } from "@/components/builder/ChromeShell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  parseFooterRow,
  parseGlobalStyle,
  parseHeaderRow,
  parseRows,
} from "@/lib/serialize";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ websiteId: string; pageId: string }>;
}) {
  const user = await requireUser();
  const { websiteId, pageId } = await params;

  // pageId พิเศษ: editor ของส่วนหัว/ท้ายเว็บไซต์ (แก้ครั้งเดียวมีผลทุกหน้า)
  if (pageId === "site-header" || pageId === "site-footer") {
    const website = await db.website.findUnique({
      where: { id: websiteId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        globalStyle: true,
        headerRow: true,
        footerRow: true,
        pages: {
          where: { isHome: true },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!website || (website.ownerId !== user.id && user.role !== "ADMIN")) {
      notFound();
    }
    const part = pageId === "site-header" ? "header" : "footer";
    const row =
      part === "header"
        ? parseHeaderRow(website.headerRow)
        : parseFooterRow(website.footerRow);
    return (
      <ChromeShell
        key={`${websiteId}-${part}`}
        websiteId={websiteId}
        websiteName={website.name}
        part={part}
        initialRow={row}
        backPageId={website.pages[0]?.id ?? null}
        globalStyle={parseGlobalStyle(website.globalStyle)}
      />
    );
  }

  const page = await db.page.findUnique({
    where: { id: pageId },
    include: {
      website: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          globalStyle: true,
          subdomain: true,
          headerRow: true,
          footerRow: true,
          pages: {
            select: { id: true, name: true, isHome: true },
            orderBy: [{ isHome: "desc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (
    !page ||
    page.websiteId !== websiteId ||
    (page.website.ownerId !== user.id && user.role !== "ADMIN")
  ) {
    notFound();
  }

  return (
    // key สำคัญ: reset client state (rows/selection) เมื่อสลับหน้า
    <BuilderShell
      key={page.id}
      websiteId={websiteId}
      pageId={page.id}
      websiteName={page.website.name}
      pages={page.website.pages}
      initialRows={parseRows(page.sections)}
      chromeHeader={parseHeaderRow(page.website.headerRow)}
      chromeFooter={parseFooterRow(page.website.footerRow)}
      globalStyle={parseGlobalStyle(page.website.globalStyle)}
    />
  );
}
