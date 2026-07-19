import { Sidebar } from "@/components/admin/Sidebar";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen w-full bg-surface-muted">
      <Sidebar userName={user.name} userEmail={user.email} />
      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </div>
  );
}
