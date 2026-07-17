import { convertLegacySections, isLegacySections } from "./page/convert";
import { makeFooterRow, makeHeaderRow } from "./page/presets";
import {
  defaultGlobalStyle,
  type GlobalStyle,
  type RowInstance,
} from "./page/types";

// SQLite ไม่มี JSON column — เก็บเป็น String แล้ว parse ที่ boundary เดียว

/** แถวนี้เป็นส่วนหัว/ท้ายเว็บไซต์ไหม (chrome — จัดการแยกระดับเว็บไซต์) */
export function isChromeRow(row: RowInstance): boolean {
  return row.columns.some((c) =>
    c.components.some((x) => x.type === "navbar" || x.type === "siteFooter"),
  );
}

export function parseRows(json: string): RowInstance[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    // ข้อมูลรุ่นเก่า (sections v1) → แปลงเป็น rows v2 ตอนอ่าน
    const rows = isLegacySections(parsed)
      ? convertLegacySections(parsed)
      : (parsed as RowInstance[]);
    // header/footer ย้ายไปเก็บระดับเว็บไซต์แล้ว — ตัดออกจากหน้าเก่าที่ยังมีค้าง
    return rows.filter((r) => !isChromeRow(r));
  } catch {
    return [];
  }
}

/** ส่วนหัวของเว็บไซต์ — ถ้ายังไม่เคยตั้ง ใช้ค่าเริ่มต้น */
export function parseHeaderRow(json: string | null): RowInstance {
  if (json) {
    try {
      return JSON.parse(json) as RowInstance;
    } catch {
      /* ตกไปใช้ default */
    }
  }
  return makeHeaderRow();
}

export function parseFooterRow(json: string | null): RowInstance {
  if (json) {
    try {
      return JSON.parse(json) as RowInstance;
    } catch {
      /* ตกไปใช้ default */
    }
  }
  return makeFooterRow();
}

export function parseGlobalStyle(json: string): GlobalStyle {
  try {
    return { ...defaultGlobalStyle, ...(JSON.parse(json) as GlobalStyle) };
  } catch {
    return defaultGlobalStyle;
  }
}
