"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  FileText,
  BookOpen,
  Image as ImageIcon,
  Megaphone,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/messages";
import { logout } from "@/server/actions/auth";

const items = [
  { href: "/administrator/dashboard", label: t.nav.dashboard, Icon: LayoutDashboard },
  { href: "/administrator/websites", label: t.nav.websites, Icon: Globe },
  { href: "/administrator/pages", label: t.nav.pages, Icon: FileText },
  { href: "/administrator/posts", label: t.nav.posts, Icon: BookOpen },
  { href: "/administrator/media", label: t.nav.media, Icon: ImageIcon },
  { href: "/administrator/popups", label: t.nav.popups, Icon: Megaphone },
  { href: "/administrator/settings", label: t.nav.settings, Icon: Settings },
];

export function Sidebar({
  userName,
  userEmail,
}: {
  userName?: string | null;
  userEmail?: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0 flex-col border-r border-border bg-surface">
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Link
          href="/administrator/dashboard"
          className="font-display font-semibold text-lg tracking-tight"
        >
          {t.app.name}
        </Link>
      </div>
      <nav className="flex-1 py-3">
        <ul className="space-y-1 px-2">
          {items.map(({ href, label, Icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-text-muted hover:bg-surface-muted hover:text-text",
                    active &&
                      "bg-[color:var(--brand-primary)]/10 text-[color:var(--brand-primary)] font-medium hover:bg-[color:var(--brand-primary)]/15",
                  )}
                >
                  <Icon
                    size={18}
                    className={active ? "" : "text-text-subtle"}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 px-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--brand-primary)]/10 text-sm font-semibold text-[color:var(--brand-primary)]">
            {(userName ?? userEmail ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName ?? "ผู้ใช้"}</p>
            <p className="truncate text-[11px] text-text-subtle">{userEmail}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title={t.action.logout}
              aria-label={t.action.logout}
              className="grid h-8 w-8 place-items-center rounded-md text-text-subtle hover:bg-surface-muted hover:text-text"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
