import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Next 16: middleware ถูก rename เป็น proxy
// CMS อยู่ใต้ /admin, ตัวสร้างอยู่ /builder — ตรวจ session แบบ optimistic
// (อ่าน cookie อย่างเดียว ไม่แตะ DB) การตรวจสิทธิ์จริงอยู่ที่ requireUser

const PROTECTED_PREFIXES = ["/admin", "/builder"];

function getSecretKey() {
  const secret =
    process.env.AUTH_SECRET ?? "dev-only-secret-change-me-in-production";
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("session")?.value;
  if (token) {
    try {
      await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
      return NextResponse.next();
    } catch {
      // token หมดอายุ/ปลอม → ตกไป redirect ด้านล่าง
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/builder/:path*"],
};
