import { componentRegistry } from "./components/registry";
import {
  pageItemId,
  type ColumnInstance,
  type ComponentInstance,
  type ComponentType,
  type RowInstance,
  type RowStyle,
} from "./types";

/**
 * Row presets — template สำเร็จรูปของ "แถว" ที่ผู้ใช้เพิ่มจาก modal
 * วางแล้วผู้ใช้แก้ทุกอย่างข้างในได้อิสระ (เพิ่ม/ลบ/ย้าย component, เปลี่ยนคอลัมน์)
 */

function comp<P extends Record<string, unknown>>(
  type: ComponentType,
  props?: Partial<P>,
): ComponentInstance {
  return {
    id: pageItemId(`c-${type}`),
    type,
    props: { ...componentRegistry[type].defaultProps(), ...props },
  };
}

function col(
  span: number,
  components: ComponentInstance[],
  style?: ColumnInstance["style"],
): ColumnInstance {
  return { id: pageItemId("col"), span, components, style };
}

export function makeRow(
  label: string,
  columns: ColumnInstance[],
  style: RowStyle = {},
): RowInstance {
  return { id: pageItemId("row"), label, columns, style };
}

/** แถวเปล่าตามจำนวน/สัดส่วนคอลัมน์ */
export function makeBlankRow(spans: number[]): RowInstance {
  return makeRow(
    `แถว ${spans.length} คอลัมน์`,
    spans.map((s) => col(s, [])),
  );
}

// ---------------------------------------------------------------------------

export interface RowPreset {
  id: string;
  label: string;
  description: string;
  build: () => RowInstance;
}

export const rowPresets: RowPreset[] = [
  {
    id: "hero",
    label: "Hero (แนะนำเว็บไซต์)",
    description: "2 คอลัมน์ — ข้อความ+ปุ่มซ้าย รูปขวา",
    build: () =>
      makeRow(
        "Hero",
        [
          col(
            6,
            [
              comp("text", {
                text: "ยินดีต้อนรับ",
                muted: false,
                size: "sm",
              }),
              comp("heading", {
                text: "เริ่มต้นสร้างเว็บไซต์ของคุณ",
                level: 1,
              }),
              comp("text", {
                text: "แก้ไขข้อความนี้ได้ทันที คลิกที่ข้อความเพื่อเริ่มเขียนใหม่",
                size: "lg",
              }),
              comp("button", {
                buttons: [
                  { label: "เริ่มใช้งาน", href: "#", variant: "solid" },
                  { label: "เรียนรู้เพิ่มเติม", href: "#", variant: "outline" },
                ],
              }),
            ],
            { verticalAlign: "center" },
          ),
          col(6, [comp("image")]),
        ],
        { paddingY: "lg" },
      ),
  },
  {
    id: "features",
    label: "จุดเด่น",
    description: "หัวข้อ + การ์ด 3 คอลัมน์",
    build: () =>
      makeRow("จุดเด่น", [
        col(4, [
          comp("heading", { text: "จุดเด่นที่ 1", level: 3 }),
          comp("text", { text: "อธิบายจุดเด่นสั้น ๆ ให้เข้าใจง่าย" }),
        ], { card: true }),
        col(4, [
          comp("heading", { text: "จุดเด่นที่ 2", level: 3 }),
          comp("text", { text: "อธิบายจุดเด่นสั้น ๆ ให้เข้าใจง่าย" }),
        ], { card: true }),
        col(4, [
          comp("heading", { text: "จุดเด่นที่ 3", level: 3 }),
          comp("text", { text: "อธิบายจุดเด่นสั้น ๆ ให้เข้าใจง่าย" }),
        ], { card: true }),
      ]),
  },
  {
    id: "image-text",
    label: "รูปพร้อมข้อความ",
    description: "2 คอลัมน์ — รูปซ้าย ข้อความขวา",
    build: () =>
      makeRow("รูปพร้อมข้อความ", [
        col(6, [comp("image")]),
        col(
          6,
          [
            comp("heading", { text: "หัวข้อของคุณ", level: 2 }),
            comp("text", {
              text: "เล่าเรื่องราว สินค้า หรือบริการของคุณให้ผู้เข้าชมเข้าใจ",
            }),
          ],
          { verticalAlign: "center" },
        ),
      ]),
  },
  {
    id: "text-block",
    label: "ข้อความ",
    description: "1 คอลัมน์ — หัวข้อ + เนื้อหา",
    build: () =>
      makeRow("ข้อความ", [
        col(12, [
          comp("heading", { text: "หัวข้อของคุณ", level: 2 }),
          comp("text", {
            text: "พิมพ์เนื้อหาของคุณที่นี่ อธิบายเรื่องราว สินค้า หรือบริการของคุณให้ผู้เข้าชมเข้าใจ",
          }),
        ]),
      ]),
  },
  {
    id: "cta",
    label: "ชวนลงมือทำ (CTA)",
    description: "หัวข้อ + ปุ่ม จัดกึ่งกลาง",
    build: () =>
      makeRow(
        "ชวนลงมือทำ",
        [
          col(
            12,
            [
              comp("heading", { text: "พร้อมเริ่มต้นหรือยัง?", level: 2 }),
              comp("text", { text: "ติดต่อเราวันนี้เพื่อรับคำปรึกษาฟรี" }),
              comp("button", {
                buttons: [{ label: "ติดต่อเรา", href: "#", variant: "solid" }],
              }),
            ],
            { align: "center" },
          ),
        ],
        { background: "#f5f5f5" },
      ),
  },
  {
    id: "contact",
    label: "ติดต่อเรา",
    description: "2 คอลัมน์ — ข้อมูลติดต่อ + แบบฟอร์ม",
    build: () =>
      makeRow("ติดต่อเรา", [
        col(5, [
          comp("heading", { text: "ติดต่อเรา", level: 2 }),
          comp("text", {
            text: "มีคำถามหรืออยากคุยกับเรา ส่งข้อความมาได้เลย ทีมงานจะตอบกลับโดยเร็ว",
          }),
          comp("text", {
            text: "โทร: 02-000-0000\nอีเมล: hello@example.com\nที่อยู่: 123 ถนนตัวอย่าง กรุงเทพฯ",
            muted: false,
          }),
        ]),
        col(7, [comp("contactForm")], { card: true }),
      ]),
  },
  {
    id: "gallery",
    label: "แกลเลอรี่รูปภาพ",
    description: "หัวข้อ + ตารางรูปภาพ",
    build: () =>
      makeRow("แกลเลอรี่", [
        col(12, [
          comp("heading", { text: "ผลงานของเรา", level: 2 }),
          comp("gallery"),
        ]),
      ]),
  },
  {
    id: "testimonial",
    label: "รีวิวจากลูกค้า",
    description: "การ์ดรีวิว 3 คอลัมน์",
    build: () =>
      makeRow("รีวิวจากลูกค้า", [
        col(4, [comp("quote")], { card: true }),
        col(4, [comp("quote")], { card: true }),
        col(4, [comp("quote")], { card: true }),
      ]),
  },
  {
    id: "stats",
    label: "ตัวเลข/สถิติ",
    description: "ตัวเลขเด่น 4 คอลัมน์",
    build: () =>
      makeRow(
        "ตัวเลข/สถิติ",
        [
          col(3, [comp("stat", { value: 100, suffix: "+", label: "ลูกค้าที่ไว้วางใจ" })], { align: "center" }),
          col(3, [comp("stat", { value: 5, suffix: " ปี", label: "ประสบการณ์" })], { align: "center" }),
          col(3, [comp("stat", { value: 24, suffix: " ชม.", label: "บริการตลอดเวลา" })], { align: "center" }),
          col(3, [comp("stat", { value: 99, suffix: "%", label: "ความพึงพอใจ" })], { align: "center" }),
        ],
        { background: "#f5f5f5" },
      ),
  },
  {
    id: "blog-list",
    label: "รายการบทความ",
    description: "หัวข้อ + การ์ดบทความล่าสุด",
    build: () =>
      makeRow("รายการบทความ", [
        col(12, [
          comp("heading", { text: "บทความล่าสุด", level: 2 }),
          comp("blogList"),
        ]),
      ]),
  },
  {
    id: "faq",
    label: "คำถามที่พบบ่อย",
    description: "หัวข้อ + รายการถาม-ตอบ กดเปิดอ่านได้",
    build: () =>
      makeRow("คำถามที่พบบ่อย", [
        col(12, [
          comp("heading", { text: "คำถามที่พบบ่อย", level: 2 }),
          comp("faq", {
            items: [
              { question: "ใช้เวลาดำเนินการนานแค่ไหน?", answer: "โดยทั่วไป 3-5 วันทำการ" },
              { question: "มีบริการหลังการขายไหม?", answer: "มีทีมดูแลตลอดอายุการใช้งาน" },
              { question: "ชำระเงินอย่างไรได้บ้าง?", answer: "โอนธนาคาร บัตรเครดิต และ QR พร้อมเพย์" },
            ],
          }),
        ]),
      ]),
  },
];

/** Header / Footer — ใช้ใน template ของเว็บไซต์ (ไม่โชว์ใน modal เพิ่มแถว) */
export function makeHeaderRow(withCta = false): RowInstance {
  return makeRow(
    "แถบเมนูด้านบน",
    [col(12, [comp("navbar", withCta ? { ctaLabel: "ติดต่อเรา" } : {})])],
    { paddingY: "none" },
  );
}

export function makeFooterRow(): RowInstance {
  return makeRow("ส่วนท้ายเว็บไซต์", [col(12, [comp("siteFooter")])], {
    paddingY: "none",
    background: "#f5f5f5",
  });
}

export function getRowPreset(id: string): RowPreset | undefined {
  return rowPresets.find((p) => p.id === id);
}
