import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicArticle, loadArticle } from "@/components/site/PublicArticle";
import { resolvePrimarySite } from "@/lib/primarySite";

// บทความของเว็บสาธารณะที่ root: /blog/[postSlug]
export async function generateMetadata({
  params,
}: {
  params: Promise<{ postSlug: string }>;
}): Promise<Metadata> {
  const site = await resolvePrimarySite();
  if (!site) return {};
  const { postSlug } = await params;
  const post = await loadArticle(site.id, postSlug);
  if (!post) return {};
  return {
    title: post.seoTitle ?? `${post.title} · ${site.name}`,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    openGraph: post.coverImageUrl
      ? { images: [post.coverImageUrl] }
      : undefined,
  };
}

export default async function RootArticle({
  params,
}: {
  params: Promise<{ postSlug: string }>;
}) {
  const site = await resolvePrimarySite();
  if (!site) notFound();
  const { postSlug } = await params;
  const post = await loadArticle(site.id, postSlug);
  if (!post) notFound();
  return <PublicArticle site={site} post={post} />;
}
