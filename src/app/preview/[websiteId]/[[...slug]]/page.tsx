import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  PublicSitePage,
  resolveSitePath,
  siteSelect,
} from "@/components/site/PublicSitePage";
import { PublicArticle, loadArticle } from "@/components/site/PublicArticle";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "ตัวอย่างเว็บไซต์" };

/**
 * พรีวิวเว็บ/เวอร์ชันใด ๆ ด้วย id (สำหรับเวอร์ชันที่ยังไม่ตั้งเป็นสาธารณะ)
 * ต้องล็อกอิน + เป็นเจ้าของ (proxy กัน /preview ไว้แล้ว)
 */
export default async function PreviewSite({
  params,
}: {
  params: Promise<{ websiteId: string; slug?: string[] }>;
}) {
  const user = await requireUser();
  const { websiteId, slug } = await params;

  const site = await db.website.findUnique({
    where: { id: websiteId },
    select: { ...siteSelect, ownerId: true },
  });
  if (!site || (site.ownerId !== user.id && user.role !== "ADMIN")) {
    notFound();
  }

  const path = resolveSitePath(slug ?? []);
  const basePath = `/preview/${websiteId}`;
  if (path.kind === "article") {
    const post = await loadArticle(site.id, path.postSlug);
    if (!post) notFound();
    return (
      <PublicArticle site={site} post={post} basePath={basePath} mode="draft" />
    );
  }
  return (
    <PublicSitePage
      site={site}
      slugPath={path.slug}
      basePath={basePath}
      mode="draft"
    />
  );
}
