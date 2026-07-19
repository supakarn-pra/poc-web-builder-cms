/**
 * โครงสร้างหน้าแบบ Row / Column / Component
 *
 *  Page
 *  └── RowInstance[]          แถว (container) — เรียงบน-ล่าง, ลากจัดลำดับได้
 *      └── ColumnInstance[]   1-4 คอลัมน์ต่อแถว แบ่งบน grid 12 ช่อง (span รวม = 12)
 *          └── ComponentInstance[]  ชิ้นส่วนซ้อนแนวตั้ง เช่น หัวข้อ ข้อความ ปุ่ม รูป
 *
 * บนมือถือทุกคอลัมน์ stack เต็มความกว้างเสมอ (ใช้ container query ไม่ใช่ media query
 * เพื่อให้ device preview ใน builder แสดงผลตรงกับของจริง)
 */

export type ComponentType =
  | "heading"
  | "text"
  | "button"
  | "image"
  | "video"
  | "gallery"
  | "quote"
  | "stat"
  | "faq"
  | "divider"
  | "spacer"
  | "contactForm"
  | "blogList"
  | "navbar"
  | "siteFooter";

/** ข้อมูลระดับเว็บไซต์ที่ component บางตัวใช้ตอน render (เช่น blogList, contactForm) */
export interface SiteData {
  websiteId?: string; // สำหรับ contactForm ส่งข้อความเข้าเว็บที่ถูกต้อง
  blogBasePath: string; // เช่น /blog หรือ /aaa/blog
  posts: Array<{
    title: string;
    slug: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    publishedAt: string | null; // ISO
    categoryName: string | null;
  }>;
}

export interface ComponentInstance<P = Record<string, unknown>> {
  id: string;
  type: ComponentType;
  props: P;
}

export interface ColumnStyle {
  /** จัดเนื้อหาแนวนอนของทุก component ในคอลัมน์ */
  align?: "left" | "center" | "right";
  /** จัดแนวตั้งเมื่อคอลัมน์ข้าง ๆ สูงกว่า */
  verticalAlign?: "top" | "center" | "bottom";
  /** แสดงเป็นการ์ด (พื้น+ขอบ+มุมโค้ง+padding) เช่น การ์ดจุดเด่น */
  card?: boolean;
}

export interface ColumnInstance {
  id: string;
  /** ความกว้างบน grid 12 ช่อง (desktop) — รวมทั้งแถวต้องได้ 12 */
  span: number;
  components: ComponentInstance[];
  style?: ColumnStyle;
}

export interface RowStyle {
  background?: string;
  paddingY?: "none" | "sm" | "md" | "lg";
  hidden?: boolean;
  /** ความกว้างของเนื้อหาในแถว */
  contentWidth?: "normal" | "wide" | "full";
}

export interface RowInstance {
  id: string;
  /** ชื่อที่แสดงในรายการซ้าย เช่น "Hero", "จุดเด่น", "แถว 2 คอลัมน์" */
  label: string;
  columns: ColumnInstance[];
  style: RowStyle;
}

/** ตัวเลือกการแบ่งคอลัมน์ต่อจำนวนคอลัมน์ (ผลรวม 12 เสมอ) */
export const columnLayouts: Record<number, number[][]> = {
  1: [[12]],
  2: [
    [6, 6],
    [5, 7],
    [7, 5],
    [4, 8],
    [8, 4],
    [3, 9],
    [9, 3],
  ],
  3: [
    [4, 4, 4],
    [3, 6, 3],
    [6, 3, 3],
    [3, 3, 6],
  ],
  4: [[3, 3, 3, 3]],
};

// ---------------------------------------------------------------------------
// Global style ระดับเว็บไซต์ (ย้ายมาจาก lib/sections เดิม)
// ---------------------------------------------------------------------------

export interface GlobalStyle {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  headingFont: "sans" | "serif" | "display";
  bodyFont: "sans" | "serif";
  buttonStyle: "solid" | "outline" | "ghost";
  radius: "none" | "sm" | "md" | "lg";
}

export const defaultGlobalStyle: GlobalStyle = {
  primaryColor: "#4F46E5",
  secondaryColor: "#0EA5E9",
  headingFont: "sans",
  bodyFont: "sans",
  buttonStyle: "solid",
  radius: "md",
};

// ---------------------------------------------------------------------------
// id helper — ใช้ทั้ง server (presets/templates) และ client (builder)
// ---------------------------------------------------------------------------

let counter = 0;
export function pageItemId(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}
