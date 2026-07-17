/** Layout สำเร็จรูปตอนสร้างหน้าใหม่ (Flow B) — อ้าง rowPreset id
 *  (ส่วนหัว/ท้ายเว็บไซต์แสดงอัตโนมัติทุกหน้า ไม่ต้องใส่ใน layout) */
export interface PageLayout {
  id: string;
  label: string;
  description: string;
  rows: string[];
}

export const pageLayouts: PageLayout[] = [
  {
    id: "blank",
    label: "หน้าว่าง",
    description: "เริ่มจากศูนย์ (มีส่วนหัว/ท้ายของเว็บไซต์ให้อยู่แล้ว)",
    rows: [],
  },
  {
    id: "about",
    label: "เกี่ยวกับเรา",
    description: "เล่าเรื่องราวธุรกิจของคุณ",
    rows: ["text-block", "image-text"],
  },
  {
    id: "service",
    label: "สินค้า / บริการ",
    description: "โชว์สิ่งที่คุณขายพร้อมปุ่มติดต่อ",
    rows: ["hero", "features", "cta"],
  },
  {
    id: "contact",
    label: "ติดต่อ",
    description: "ข้อมูลติดต่อ + แบบฟอร์ม",
    rows: ["contact"],
  },
];

export function getPageLayout(id: string): PageLayout | undefined {
  return pageLayouts.find((l) => l.id === id);
}
