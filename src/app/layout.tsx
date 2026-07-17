import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Prompt } from "next/font/google";
import "./globals.css";

const body = IBM_Plex_Sans_Thai({
  variable: "--font-body",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

const heading = Prompt({
  variable: "--font-heading",
  subsets: ["latin", "thai"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "POC Web Builder",
    template: "%s · POC Web Builder",
  },
  description: "สร้างเว็บไซต์ของคุณเองภายใน 30 นาที ไม่ต้องเขียนโค้ด",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      className={`${body.variable} ${heading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-text">
        {children}
      </body>
    </html>
  );
}
