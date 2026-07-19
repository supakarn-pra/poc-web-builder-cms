import { generateHTML } from "@tiptap/html";
import { db } from "@/lib/db";
import { blogExtensions } from "@/lib/blog/extensions";
import { parseFooterRow, parseGlobalStyle, parseHeaderRow } from "@/lib/serialize";
import { PageRows, RowView } from "@/lib/page/render";
import { toCssVariables } from "@/lib/globalStyle";
import { siteChrome, type RenderMode, type SiteRecord } from "./PublicSitePage";

export async function loadArticle(siteId: string, postSlugRaw: string) {
  const slug = decodeURIComponent(postSlugRaw);
  const post = await db.blogPost.findUnique({
    where: { websiteId_slug: { websiteId: siteId, slug } },
    include: {
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
  if (!post || post.status !== "PUBLISHED") return null;
  return post;
}

/** Render บทความเดี่ยว — header + เนื้อหา + footer */
export async function PublicArticle({
  site,
  post,
  mode = "published",
}: {
  site: SiteRecord & { name?: string };
  post: NonNullable<Awaited<ReturnType<typeof loadArticle>>>;
  mode?: RenderMode;
}) {
  const globalStyle = parseGlobalStyle(site.globalStyle);
  const chrome = siteChrome(site, mode);

  let contentHtml = "";
  try {
    contentHtml = generateHTML(JSON.parse(post.content), blogExtensions());
  } catch {
    contentHtml = "<p></p>";
  }

  const tags = post.tagsCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div style={toCssVariables(globalStyle)}>
      <PageRows rows={[parseHeaderRow(chrome.header)]} global={globalStyle} />

      <article className="mx-auto max-w-3xl px-4 py-12 @3xl:px-6">
        <header className="space-y-3">
          <p className="text-sm text-text-subtle">
            {post.category?.name ? `${post.category.name} · ` : ""}
            {post.publishedAt
              ? new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(
                  post.publishedAt,
                )
              : ""}
            {post.author?.name ? ` · โดย ${post.author.name}` : ""}
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="text-lg text-text-muted">{post.excerpt}</p>
          ) : null}
        </header>

        {post.coverImageUrl ? (
          <div className="mt-6 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImageUrl} alt="" className="w-full object-cover" />
          </div>
        ) : null}

        <div
          className="rich-text mt-8"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {tags.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-muted px-3 py-1 text-xs text-text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </article>

      <div className="@container">
        <RowView row={parseFooterRow(chrome.footer)} global={globalStyle} />
      </div>
    </div>
  );
}
