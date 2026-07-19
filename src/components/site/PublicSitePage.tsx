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

export type RenderMode = "published" | "draft";

export interface SiteRecord {
  id: string;
  status: string;
  globalStyle: string;
  headerRow: string | null;
  footerRow: string | null;
  publishedHeaderRow: string | null;
  publishedFooterRow: string | null;
  publishedAt: Date | null;
}

/** columns ที่ต้อง select เพื่อ render เว็บ (ใช้ร่วมทุก route) */
export const siteSelect = {
  id: true,
  name: true,
  status: true,
  globalStyle: true,
  headerRow: true,
  footerRow: true,
  publishedHeaderRow: true,
  publishedFooterRow: true,
  publishedAt: true,
} as const;

export type SitePath =
  | { kind: "page"; slug: string }
  | { kind: "article"; postSlug: string };

/** แปลง path segments ภายในเว็บหนึ่ง → หน้า หรือ บทความ (/blog/xxx) */
export function resolveSitePath(segs: string[]): SitePath {
  if (segs.length >= 2 && segs[0] === "blog") {
    return { kind: "article", postSlug: segs.slice(1).join("/") };
  }
  return { kind: "page", slug: segs.join("/") };
}

/** ดึงหน้าตาม slug ("" = หน้าแรก) — คืน null ถ้าไม่พบ */
export async function loadSitePage(siteId: string, slugPath: string) {
  const slug = decodeURIComponent(slugPath) || "home";
  return db.page.findUnique({
    where: { websiteId_slug: { websiteId: siteId, slug } },
  });
}

/** chrome ของเว็บตามโหมด (published = snapshot, draft = ฉบับร่าง) */
export function siteChrome(site: SiteRecord, mode: RenderMode) {
  return mode === "published"
    ? { header: site.publishedHeaderRow, footer: site.publishedFooterRow }
    : { header: site.headerRow, footer: site.footerRow };
}

/**
 * Render หนึ่งหน้าของเว็บไซต์ (header + rows + footer + siteData)
 * mode "published" (เว็บจริง — ใช้ snapshot ตอนกดเผยแพร่) | "draft" (พรีวิว)
 * basePath: "" = เว็บหลักที่ root, "/{slug}" = landing แยก, "/preview/{id}" = พรีวิว
 */
export async function PublicSitePage({
  site,
  slugPath,
  basePath,
  mode = "published",
}: {
  site: SiteRecord;
  slugPath: string;
  basePath: string;
  mode?: RenderMode;
}) {
  const page = await loadSitePage(site.id, slugPath);
  if (!page) notFound();

  const rowsJson = mode === "published" ? page.publishedSections : page.sections;
  // หน้าใหม่ที่ยังไม่เคยเผยแพร่ → ยังไม่มีบนเว็บจริง
  if (rowsJson == null) notFound();

  const chrome = siteChrome(site, mode);
  const rows = [
    parseHeaderRow(chrome.header),
    ...parseRows(rowsJson),
    parseFooterRow(chrome.footer),
  ];
  const globalStyle = parseGlobalStyle(site.globalStyle);

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
    websiteId: site.id,
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
      {mode === "draft" ? (
        <div className="bg-warning/10 px-4 py-2 text-center text-xs text-warning">
          โหมดตัวอย่าง (ฉบับร่าง) — คนทั่วไปยังไม่เห็นจนกว่าจะกด &quot;เผยแพร่&quot;
        </div>
      ) : null}
      <PageRows rows={rows} global={globalStyle} siteData={siteData} />
    </div>
  );
}
