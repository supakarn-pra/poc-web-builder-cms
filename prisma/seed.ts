import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getTemplate, instantiateRows } from "../src/lib/templates";
import { makeFooterRow, makeHeaderRow } from "../src/lib/page/presets";
import { defaultGlobalStyle } from "../src/lib/page/types";

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

async function main() {
  // Admin สำหรับดูแลระบบ — เปลี่ยนรหัสผ่านก่อนขึ้น production
  const admin = await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "ผู้ดูแลระบบ",
      passwordHash: await bcrypt.hash("admin1234", 10),
      role: "ADMIN",
    },
  });

  // เว็บไซต์ตัวอย่างของ admin — ไว้ demo ทันทีโดยไม่ต้องผ่าน wizard
  const existing = await db.website.findUnique({
    where: { subdomain: "demo" },
  });
  if (!existing) {
    const template = getTemplate("LANDING")!;
    await db.website.create({
      data: {
        name: "เว็บไซต์ตัวอย่าง",
        subdomain: "demo",
        ownerId: admin.id,
        siteType: "LANDING",
        globalStyle: JSON.stringify(defaultGlobalStyle),
        headerRow: JSON.stringify(makeHeaderRow(true)),
        footerRow: JSON.stringify(makeFooterRow()),
        pages: {
          create: template.pages.map((p) => ({
            name: p.name,
            slug: p.slug,
            isHome: p.isHome ?? false,
            sections: JSON.stringify(instantiateRows(p.rows)),
          })),
        },
      },
    });
  }

  console.log("Seed เรียบร้อย: admin@example.com / admin1234 + เว็บไซต์ demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
