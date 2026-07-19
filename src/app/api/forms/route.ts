import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  websiteId: z.string().min(1),
  name: z.string().min(1, "กรุณากรอกชื่อ").max(100),
  email: z.string().email("อีเมลไม่ถูกต้อง").max(200),
  message: z.string().min(1, "กรุณากรอกข้อความ").max(3000),
  // honeypot — คนจริงไม่เห็น/ไม่กรอก ช่องนี้ต้องว่าง
  company: z.string().max(0).optional().or(z.literal("")),
});

/** รับข้อความจากแบบฟอร์มติดต่อบนหน้าเว็บ (public — ไม่ต้องล็อกอิน) */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const website = await db.website.findUnique({
    where: { id: parsed.data.websiteId },
    select: { id: true },
  });
  if (!website) {
    return NextResponse.json({ error: "ไม่พบเว็บไซต์" }, { status: 404 });
  }

  await db.formSubmission.create({
    data: {
      websiteId: website.id,
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    },
  });

  return NextResponse.json({ ok: true });
}
