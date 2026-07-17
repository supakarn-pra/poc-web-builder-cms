import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // สำหรับ Docker deploy — สร้าง .next/standalone ที่มีเฉพาะไฟล์ที่ต้องใช้
  output: "standalone",
  turbopack: {
    // Force this project as the workspace root; ป้องกันไม่ให้ Next.js
    // ไปจับ lockfile ใน parent directory
    root: __dirname,
  },
};

export default nextConfig;
