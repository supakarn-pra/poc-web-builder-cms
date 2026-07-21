import { Topbar } from "@/components/admin/Topbar";
import { CreateWebsiteWizard } from "@/components/websites/CreateWebsiteWizard";

export const metadata = { title: "สร้างเวอร์ชันใหม่" };

export default function NewWebsitePage() {
  return (
    <>
      <Topbar title="สร้างเวอร์ชันใหม่" />
      <div className="flex-1 p-6 md:p-10">
        <CreateWebsiteWizard />
      </div>
    </>
  );
}
