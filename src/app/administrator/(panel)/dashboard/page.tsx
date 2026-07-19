import Link from "next/link";
import { ExternalLink, PenLine, Plus } from "lucide-react";
import { Topbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { siteHref } from "@/lib/site/url";
import { t } from "@/lib/messages";

export const metadata = { title: "ภาพรวม" };

export default async function DashboardPage() {
  const user = await requireUser();

  const website = await db.website.findFirst({
    where: { parentId: null, ...(user.role === "ADMIN" ? {} : { ownerId: user.id }) }, // เมนู CMS อิงเว็บหลักเสมอ (landing ไม่แย่ง context)
    orderBy: { updatedAt: "desc" },
    include: {
      pages: {
        select: { id: true, name: true, isHome: true, status: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      },
      _count: { select: { posts: true, media: true } },
      parent: { select: { isPublic: true } },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          message: true,
          createdAt: true,
        },
      },
    },
  });

  if (!website) {
    return (
      <>
        <Topbar title={t.nav.dashboard} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <div className="space-y-2 max-w-md">
            <h2 className="font-display text-2xl font-semibold">
              ยินดีต้อนรับ, {user.name ?? "ผู้ใช้ใหม่"} 👋
            </h2>
            <p className="text-text-muted">
              เริ่มจากสร้างเว็บไซต์แรกของคุณ — เลือก Template แล้วระบบจะเตรียมหน้าและโครงสร้างให้อัตโนมัติ
            </p>
          </div>
          <Link href="/administrator/websites/new">
            <Button size="lg">
              <Plus size={16} /> {t.action.createWebsite}
            </Button>
          </Link>
        </div>
      </>
    );
  }

  const homePage = website.pages.find((p) => p.isHome) ?? website.pages[0];
  const published = website.status === "PUBLISHED";
  const publishedPages = website.pages.filter(
    (p) => p.status === "PUBLISHED",
  ).length;
  const recentPages = website.pages.slice(0, 3);

  const stats = [
    {
      label: t.nav.pages,
      value: website.pages.length,
      hint: `เผยแพร่แล้ว ${publishedPages} หน้า`,
    },
    { label: t.nav.posts, value: website._count.posts, hint: "เขียนที่เมนู บทความ" },
    { label: t.nav.media, value: website._count.media, hint: "จัดการที่เมนู รูปภาพ" },
  ];

  return (
    <>
      <Topbar
        title={t.nav.dashboard}
        websiteName={website.name}
        actions={
          <>
            <Link
              href={siteHref(website, website.parent?.isPublic ?? false)}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
            >
              <ExternalLink size={14} /> เปิดเว็บไซต์
            </Link>
            {homePage ? (
              <Link href={`/builder/${website.id}/${homePage.id}`}>
                <Button variant="primary">{t.action.editWebsite}</Button>
              </Link>
            ) : null}
          </>
        }
      />

      <div className="p-6 space-y-6 flex-1">
        <section className="rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-text-muted">สถานะเว็บไซต์</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                {website.name}
                <span
                  className={
                    published
                      ? "ml-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success align-middle"
                      : "ml-3 inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning align-middle"
                  }
                >
                  <span
                    className={
                      published
                        ? "h-1.5 w-1.5 rounded-full bg-success"
                        : "h-1.5 w-1.5 rounded-full bg-warning"
                    }
                  />
                  {published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                </span>
              </h2>
              <p className="text-sm text-text-muted mt-1">
                ที่อยู่เว็บไซต์:{" "}
                <span className="text-[color:var(--brand-primary)]">
                  {website.isPublic
                    ? "platform.com (หน้าหลัก)"
                    : website.parentId
                      ? `platform.com/${website.subdomain}`
                      : "ยังไม่เผยแพร่ (ตั้งเป็นเว็บสาธารณะที่เมนูเว็บไซต์)"}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/administrator/posts">
                <Button variant="secondary">
                  <PenLine size={16} /> {t.action.createPost}
                </Button>
              </Link>
              {homePage ? (
                <Link href={`/builder/${website.id}/${homePage.id}`}>
                  <Button variant="primary">{t.action.editWebsite}</Button>
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border bg-surface p-5"
            >
              <p className="text-sm text-text-muted">{s.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold">
                {s.value}
              </p>
              <p className="text-xs text-text-subtle mt-1">{s.hint}</p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-5 py-3">
            <h3 className="font-medium">แก้ไขล่าสุด</h3>
          </div>
          <ul className="divide-y divide-border">
            {recentPages.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/builder/${website.id}/${p.id}`}
                  className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-surface-muted"
                >
                  <PenLine size={15} className="text-text-subtle" />
                  <span className="flex-1">{p.name}</span>
                  <span className="text-xs text-text-subtle">
                    {new Intl.DateTimeFormat("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(p.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-5 py-3">
            <h3 className="font-medium">
              ข้อความจากแบบฟอร์มติดต่อ
              {website.submissions.length > 0
                ? ` (ล่าสุด ${website.submissions.length})`
                : ""}
            </h3>
          </div>
          {website.submissions.length === 0 ? (
            <p className="px-5 py-6 text-sm text-text-muted">
              ยังไม่มีข้อความ — เมื่อมีคนกรอกแบบฟอร์มติดต่อบนเว็บ ข้อความจะมาแสดงที่นี่
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {website.submissions.map((s) => (
                <li key={s.id} className="px-5 py-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium">
                      {s.name}{" "}
                      <a
                        href={`mailto:${s.email}`}
                        className="font-normal text-[color:var(--brand-primary)] hover:underline"
                      >
                        {s.email}
                      </a>
                    </p>
                    <span className="shrink-0 text-xs text-text-subtle">
                      {new Intl.DateTimeFormat("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(s.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-text-muted">
                    {s.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
