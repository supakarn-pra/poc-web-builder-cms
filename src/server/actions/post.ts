"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export interface PostActionState {
  error?: string;
  saved?: boolean;
}

function slugify(text: string) {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return s || `post-${Date.now().toString(36)}`;
}

async function ownedWebsite(userId: string, role: string) {
  return db.website.findFirst({
    where: { parentId: null, ...(role === "ADMIN" ? {} : { ownerId: userId }) },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
}

/** สร้างบทความร่างเปล่าแล้วพาเข้า editor ทันที (Flow C: เขียนได้ใน 5 นาที) */
export async function createPost() {
  const user = await requireUser();
  const website = await ownedWebsite(user.id, user.role);
  if (!website) redirect("/administrator/websites/new");

  const base = "บทความใหม่";
  let slug = slugify(`${base}-${Date.now().toString(36)}`);
  const dup = await db.blogPost.findUnique({
    where: { websiteId_slug: { websiteId: website.id, slug } },
    select: { id: true },
  });
  if (dup) slug = `${slug}-2`;

  const post = await db.blogPost.create({
    data: {
      websiteId: website.id,
      title: base,
      slug,
      content: JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }),
      authorId: user.id,
    },
    select: { id: true },
  });

  redirect(`/administrator/posts/${post.id}`);
}

const saveSchema = z.object({
  postId: z.string().min(1),
  title: z.string().min(1, "กรุณาตั้งชื่อบทความ").max(150),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9฀-๿]+(-[a-z0-9฀-๿]+)*$/, "URL ใช้ได้เฉพาะตัวอักษร ตัวเลข และขีดกลาง"),
  excerpt: z.string().max(300).optional(),
  coverImageUrl: z.string().optional(),
  content: z.string().min(2), // Tiptap JSON string
  categoryId: z.string().optional(),
  newCategory: z.string().max(60).optional(),
  tagsCsv: z.string().max(300).optional(),
  seoTitle: z.string().max(150).optional(),
  seoDescription: z.string().max(300).optional(),
  intent: z.enum(["draft", "publish", "unpublish"]),
});

async function assertPostOwnership(postId: string) {
  const user = await requireUser();
  const post = await db.blogPost.findUnique({
    where: { id: postId },
    select: { websiteId: true, website: { select: { ownerId: true } } },
  });
  if (!post || (post.website.ownerId !== user.id && user.role !== "ADMIN")) {
    return null;
  }
  return { user, websiteId: post.websiteId };
}

export async function savePost(
  _prev: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const parsed = saveSchema.safeParse({
    postId: formData.get("postId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") || undefined,
    coverImageUrl: formData.get("coverImageUrl") || undefined,
    content: formData.get("content"),
    categoryId: formData.get("categoryId") || undefined,
    newCategory: formData.get("newCategory") || undefined,
    tagsCsv: formData.get("tagsCsv") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    intent: formData.get("intent"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await assertPostOwnership(parsed.data.postId);
  if (!ctx) return { error: "ไม่พบบทความ" };

  // slug ต้องไม่ชนกับบทความอื่นในเว็บไซต์เดียวกัน
  const dupSlug = await db.blogPost.findFirst({
    where: {
      websiteId: ctx.websiteId,
      slug: parsed.data.slug,
      NOT: { id: parsed.data.postId },
    },
    select: { id: true },
  });
  if (dupSlug) return { error: "URL นี้ถูกใช้กับบทความอื่นแล้ว" };

  // หมวดหมู่ใหม่ (ถ้ากรอก)
  let categoryId = parsed.data.categoryId || null;
  if (parsed.data.newCategory) {
    const catSlug = slugify(parsed.data.newCategory);
    const category = await db.category.upsert({
      where: { websiteId_slug: { websiteId: ctx.websiteId, slug: catSlug } },
      update: {},
      create: {
        websiteId: ctx.websiteId,
        name: parsed.data.newCategory,
        slug: catSlug,
      },
    });
    categoryId = category.id;
  }

  const { intent } = parsed.data;
  const current = await db.blogPost.findUnique({
    where: { id: parsed.data.postId },
    select: { status: true, publishedAt: true },
  });

  await db.blogPost.update({
    where: { id: parsed.data.postId },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt ?? null,
      coverImageUrl: parsed.data.coverImageUrl ?? null,
      content: parsed.data.content,
      categoryId,
      tagsCsv: parsed.data.tagsCsv ?? "",
      seoTitle: parsed.data.seoTitle ?? null,
      seoDescription: parsed.data.seoDescription ?? null,
      status:
        intent === "publish"
          ? "PUBLISHED"
          : intent === "unpublish"
            ? "DRAFT"
            : (current?.status ?? "DRAFT"),
      publishedAt:
        intent === "publish"
          ? (current?.publishedAt ?? new Date())
          : intent === "unpublish"
            ? null
            : current?.publishedAt,
    },
  });

  revalidatePath("/administrator/posts");
  return { saved: true };
}

export async function deletePost(
  _prev: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const postId = String(formData.get("postId") ?? "");
  const ctx = await assertPostOwnership(postId);
  if (!ctx) return { error: "ไม่พบบทความ" };

  await db.blogPost.delete({ where: { id: postId } });
  revalidatePath("/administrator/posts");
  redirect("/administrator/posts");
}
