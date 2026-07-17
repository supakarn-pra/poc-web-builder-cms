import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  parseFooterRow,
  parseGlobalStyle,
  parseHeaderRow,
  parseRows,
} from "@/lib/serialize";
import { PageRows } from "@/lib/page/render";
import { toCssVariables } from "@/lib/globalStyle";

export interface SiteRecord {
  id: string;
  status: string;
  globalStyle: string;
  headerRow: string | null;
  footerRow: string | null;
}

/** ดึงหน้าตาม slug ("" = หน้าแรก) — คืน null ถ้าไม่พบ */
export async function loadSitePage(siteId: string, slugPath: string) {
  const slug = decodeURIComponent(slugPath) || "home";
  return db.page.findUnique({
    where: { websiteId_slug: { websiteId: siteId, slug } },
  });
}

/**
 * Render หนึ่งหน้าของเว็บไซต์ (header + rows + footer + siteData)
 * ใช้ร่วมทั้ง root "/" (primary site) และ /sites/[subdomain]
 * basePath: "" สำหรับ root, "/sites/{subdomain}" สำหรับโดเมนย่อย
 */
export async function PublicSitePage({
  site,
  slugPath,
  basePath,
}: {
  site: SiteRecord;
  slugPath: string;
  basePath: string;
}) {
  const page = await loadSitePage(site.id, slugPath);
  if (!page) notFound();

  const rows = [
    parseHeaderRow(site.headerRow),
    ...parseRows(page.sections),
    parseFooterRow(site.footerRow),
  ];
  const globalStyle = parseGlobalStyle(site.globalStyle);
  const isDraft = site.status !== "PUBLISHED";

  const posts = await db.blogPost.findMany({
    where: { websiteId: site.id, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 24,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
      category: { select: { name: true } },
    },
  });
  const siteData = {
    blogBasePath: `${basePath}/blog`,
    posts: posts.map((p) => ({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      coverImageUrl: p.coverImageUrl,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      categoryName: p.category?.name ?? null,
    })),
  };

  return (
    <div style={toCssVariables(globalStyle)}>
      {isDraft ? (
        <div className="bg-warning/10 px-4 py-2 text-center text-xs text-warning">
          ตัวอย่างฉบับร่าง — ยังไม่ได้ตั้งเป็นเว็บสาธารณะ
        </div>
      ) : null}
      <PageRows rows={rows} global={globalStyle} siteData={siteData} />
    </div>
  );
}
