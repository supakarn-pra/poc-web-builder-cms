import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession } from "./session";

/** ผู้ใช้ปัจจุบันจาก session cookie — cache ต่อ request */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  return user;
});

/** ใช้ในหน้า (admin)/builder — redirect ไป login ถ้าไม่มี session */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/administrator/login");
  return user;
}
