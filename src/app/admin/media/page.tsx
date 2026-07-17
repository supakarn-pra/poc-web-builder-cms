import { Topbar } from "@/components/admin/Topbar";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "รูปภาพ" };

export default async function MediaPage() {
  const user = await requireUser();
  const website = await db.website.findFirst({
    where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { name: true },
  });

  return (
    <>
      <Topbar title="รูปภาพ" websiteName={website?.name} />
      <div className="flex-1 p-6">
        <MediaLibrary />
      </div>
    </>
  );
}
