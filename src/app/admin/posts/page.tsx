import Link from "next/link";
import { BookOpen, PenLine, Plus } from "lucide-react";
import { Topbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createPost } from "@/server/actions/post";

export const metadata = { title: "บทความ" };

export default async function PostsPage() {
  const user = await requireUser();
  const website = await db.website.findFirst({
    where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      posts: {
        orderBy: { updatedAt: "desc" },
        include: { category: { select: { name: true } } },
      },
    },
  });

  if (!website) {
    return (
      <>
        <Topbar title="บทความ" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-text-muted">สร้างเว็บไซต์ก่อน แล้วค่อยเขียนบทความ</p>
          <Link href="/admin/websites/new">
            <Button>สร้างเว็บไซต์</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="บทความ"
        websiteName={website.name}
        actions={
          <form action={createPost}>
            <Button type="submit">
              <Plus size={16} /> เขียนบทความใหม่
            </Button>
          </form>
        }
      />
      <div className="flex-1 p-6">
        {website.posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border-strong bg-surface p-16 text-center">
            <BookOpen size={28} className="text-text-subtle" />
            <p className="text-text-muted">
              ยังไม่มีบทความ — เริ่มเขียนเรื่องแรกของคุณ ใช้เวลาไม่ถึง 5 นาที
            </p>
            <form action={createPost}>
              <Button type="submit">
                <Plus size={16} /> เขียนบทความใหม่
              </Button>
            </form>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface divide-y divide-border">
            {website.posts.map((post) => (
              <Link
                key={post.id}
                href={`/admin/posts/${post.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-muted"
              >
                {post.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImageUrl}
                    alt=""
                    className="h-11 w-16 rounded-md object-cover"
                  />
                ) : (
                  <span className="grid h-11 w-16 place-items-center rounded-md bg-surface-muted text-text-subtle">
                    <PenLine size={15} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{post.title}</p>
                  <p className="text-xs text-text-subtle">
                    {post.category?.name ? `${post.category.name} · ` : ""}
                    อัปเดต{" "}
                    {new Intl.DateTimeFormat("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(post.updatedAt)}
                  </p>
                </div>
                <span
                  className={
                    post.status === "PUBLISHED"
                      ? "rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                      : "rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"
                  }
                >
                  {post.status === "PUBLISHED" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
