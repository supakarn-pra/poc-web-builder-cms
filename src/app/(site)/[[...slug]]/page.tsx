import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  PublicSitePage,
  loadSitePage,
  resolveSitePath,
  siteSelect,
  type SiteRecord,
} from "@/components/site/PublicSitePage";
import { PublicArticle, loadArticle } from "@/components/site/PublicArticle";
import { DefaultLanding } from "@/components/site/DefaultLanding";
import { resolvePrimarySite } from "@/lib/primarySite";

type ResolvedSite = SiteRecord & { name: string };

/**
 * root:
 *  /                         → หน้าแรกเว็บสาธารณะ
 *  /{pageSlug}               → หน้าอื่นของเว็บสาธารณะ
 *  /{landingSlug}/...        → Landing แยกใต้เว็บสาธารณะ (sub-path)
 *  (/blog/[post] มี route แยกจัดการหน้าบทความของเว็บหลัก)
 */
async function resolveRoot(segs: string[]): Promise<{
  site: ResolvedSite;
  basePath: string;
  inner: string[];
} | null> {
  const primary = await resolvePrimarySite();
  if (!primary) return null;

  // segment แรกตรงกับ Landing แยกของเว็บสาธารณะไหม (ต้องเคยเผยแพร่แล้วเท่านั้น)
  if (segs.length > 0) {
    const landing = await db.website.findFirst({
      where: {
        subdomain: segs[0],
        parentId: primary.id,
        publishedAt: { not: null },
      },
      select: siteSelect,
    });
    if (landing) {
      return { site: landing, basePath: `/${segs[0]}`, inner: segs.slice(1) };
    }
  }
  return { site: primary, basePath: "", inner: segs };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolveRoot(slug ?? []);
  if (!r) return {};
  const path = resolveSitePath(r.inner);
  if (path.kind === "article") {
    const post = await loadArticle(r.site.id, path.postSlug);
    return post
      ? {
          title: post.seoTitle ?? `${post.title} · ${r.site.name}`,
          description: post.seoDescription ?? post.excerpt ?? undefined,
        }
      : {};
  }
  const page = await loadSitePage(r.site.id, path.slug);
  return page
    ? {
        title: page.seoTitle ?? `${page.name} · ${r.site.name}`,
        description: page.seoDescription ?? undefined,
      }
    : { title: r.site.name };
}

export default async function RootSite({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const r = await resolveRoot(slug ?? []);
  if (!r) return <DefaultLanding />;

  const path = resolveSitePath(r.inner);
  if (path.kind === "article") {
    const post = await loadArticle(r.site.id, path.postSlug);
    if (!post) notFound();
    return <PublicArticle site={r.site} post={post} basePath={r.basePath} />;
  }
  return (
    <PublicSitePage site={r.site} slugPath={path.slug} basePath={r.basePath} />
  );
}
