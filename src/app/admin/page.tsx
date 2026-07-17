import { redirect } from "next/navigation";

// /admin → ภาพรวม
export default function AdminIndex() {
  redirect("/admin/dashboard");
}
