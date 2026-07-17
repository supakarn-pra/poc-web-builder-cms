import { getRowPreset } from "./page/presets";
import type { RowInstance } from "./page/types";

export type SiteType = "LANDING" | "COMPANY" | "BLOG";

export interface TemplatePage {
  name: string;
  slug: string;
  isHome?: boolean;
  /** ลำดับ row ในหน้า — id ของ rowPreset (header/footer เก็บระดับเว็บไซต์ ไม่อยู่ในหน้า) */
  rows: string[];
}

export interface SiteTemplate {
  siteType: SiteType;
  label: string;
  description: string;
  pages: TemplatePage[];
}

export const siteTemplates: SiteTemplate[] = [
  {
    siteType: "LANDING",
    label: "Landing Page",
    description: "หน้าเดียวจบ เหมาะกับแคมเปญ สินค้าใหม่ หรือ event",
    pages: [
      {
        name: "หน้าแรก",
        slug: "home",
        isHome: true,
        rows: ["hero", "features", "text-block", "faq", "cta"],
      },
    ],
  },
  {
    siteType: "COMPANY",
    label: "เว็บไซต์บริษัท",
    description: "หลายหน้า: หน้าแรก เกี่ยวกับเรา บริการ ติดต่อ",
    pages: [
      {
        name: "หน้าแรก",
        slug: "home",
        isHome: true,
        rows: ["hero", "features", "cta"],
      },
      {
        name: "เกี่ยวกับเรา",
        slug: "about",
        rows: ["text-block", "image-text"],
      },
      {
        name: "บริการ",
        slug: "services",
        rows: ["features", "cta"],
      },
      {
        name: "ติดต่อเรา",
        slug: "contact",
        rows: ["contact"],
      },
    ],
  },
  {
    siteType: "BLOG",
    label: "Blog",
    description: "เว็บไซต์สำหรับเขียนบทความเป็นหลัก",
    pages: [
      {
        name: "หน้าแรก",
        slug: "home",
        isHome: true,
        rows: ["hero", "blog-list"],
      },
      {
        name: "เกี่ยวกับผู้เขียน",
        slug: "about",
        rows: ["text-block"],
      },
    ],
  },
];

/** สร้าง RowInstance[] ใหม่ (id ใหม่ทุกครั้ง) จากรายการ preset id */
export function instantiateRows(rowIds: string[]): RowInstance[] {
  return rowIds.map((id) => {
    const preset = getRowPreset(id);
    if (!preset) throw new Error(`ไม่พบ row preset: ${id}`);
    return preset.build();
  });
}

export function getTemplate(siteType: string): SiteTemplate | undefined {
  return siteTemplates.find((t) => t.siteType === siteType);
}
