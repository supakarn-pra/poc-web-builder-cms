import { notFound } from "next/navigation";
import { PostEditor } from "@/components/blog/PostEditor";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "เขียนบทความ" };

export default async function PostEditorPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const user = await requireUser();
  const { postId } = await params;

  const post = await db.blogPost.findUnique({
    where: { id: postId },
    include: {
      website: {
        select: {
          ownerId: true,
          subdomain: true,
          categories: { select: { id: true, name: true }, orderBy: { name: "asc" } },
        },
      },
    },
  });

  if (!post || (post.website.ownerId !== user.id && user.role !== "ADMIN")) {
    notFound();
  }

  return (
    <PostEditor
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageUrl,
        content: post.content,
        categoryId: post.categoryId,
        tagsCsv: post.tagsCsv,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        status: post.status,
      }}
      categories={post.website.categories}
      siteUrlPrefix={`/sites/${post.website.subdomain}/blog`}
    />
  );
}
