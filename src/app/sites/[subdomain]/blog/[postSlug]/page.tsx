import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PublicArticle, loadArticle } from "@/components/site/PublicArticle";
import type { SiteRecord } from "@/components/site/PublicSitePage";

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
  params: Promise<{ subdomain: string; postSlug: string }>;
}): Promise<Metadata> {
  const { subdomain, postSlug } = await params;
  const site = await loadSite(subdomain);
  if (!site) return {};
  const post = await loadArticle(site.id, postSlug);
  if (!post) return {};
  return {
    title: post.seoTitle ?? `${post.title} · ${site.name}`,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    openGraph: post.coverImageUrl ? { images: [post.coverImageUrl] } : undefined,
  };
}

export default async function SubdomainArticle({
  params,
}: {
  params: Promise<{ subdomain: string; postSlug: string }>;
}) {
  const { subdomain, postSlug } = await params;
  const site = await loadSite(subdomain);
  if (!site) notFound();
  const post = await loadArticle(site.id, postSlug);
  if (!post) notFound();
  return <PublicArticle site={site} post={post} />;
}
