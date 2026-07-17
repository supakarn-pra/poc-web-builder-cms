import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  PublicSitePage,
  loadSitePage,
} from "@/components/site/PublicSitePage";
import type { SiteRecord } from "@/components/site/PublicSitePage";

/**
 * เว็บไซต์ที่โดเมนย่อย เช่น blog.mybrand.platform.com
 * Sprint 5: proxy rewrite Host → /sites/[subdomain]/*; ตอนนี้เข้าตรง path ได้
 */
async function loadSite(subdomain: string): Promise<
  (SiteRecord & { name: string }) | null
> {
  return db.website.findUnique({
    where: { subdomain: decodeURIComponent(subdomain) },
    select: {
      id: true,
      name: true,
      status: true,
      globalStyle: true,
      headerRow: true,
      footerRow: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const site = await loadSite(subdomain);
  if (!site) return {};
  const page = await loadSitePage(site.id, slug?.join("/") ?? "");
  if (!page) return { title: site.name };
  return {
    title: page.seoTitle ?? `${page.name} · ${site.name}`,
    description: page.seoDescription ?? undefined,
  };
}

export default async function SubdomainSite({
  params,
}: {
  params: Promise<{ subdomain: string; slug?: string[] }>;
}) {
  const { subdomain, slug } = await params;
  const site = await loadSite(subdomain);
  if (!site) notFound();
  return (
    <PublicSitePage
      site={site}
      slugPath={slug?.join("/") ?? ""}
      basePath={`/sites/${subdomain}`}
    />
  );
}
