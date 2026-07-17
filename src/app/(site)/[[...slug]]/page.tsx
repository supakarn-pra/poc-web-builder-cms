import type { Metadata } from "next";
import {
  PublicSitePage,
  loadSitePage,
} from "@/components/site/PublicSitePage";
import { DefaultLanding } from "@/components/site/DefaultLanding";
import { resolvePrimarySite } from "@/lib/primarySite";

// root "/" = เว็บไซต์จริงที่เลือกเป็นสาธารณะ; "/about" ฯลฯ = หน้าอื่นของเว็บนั้น
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const site = await resolvePrimarySite();
  if (!site) return {};
  const { slug } = await params;
  const page = await loadSitePage(site.id, slug?.join("/") ?? "");
  if (!page) return { title: site.name };
  return {
    title: page.seoTitle ?? `${page.name} · ${site.name}`,
    description: page.seoDescription ?? undefined,
  };
}

export default async function RootSite({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const site = await resolvePrimarySite();
  if (!site) return <DefaultLanding />;
  const { slug } = await params;
  return (
    <PublicSitePage site={site} slugPath={slug?.join("/") ?? ""} basePath="" />
  );
}
