import { componentRegistry } from "./components/registry";
import { makeRow, makeBlankRow } from "./presets";
import {
  pageItemId,
  type ColumnInstance,
  type ComponentInstance,
  type ComponentType,
  type RowInstance,
} from "./types";

/**
 * แปลงข้อมูลรุ่นเก่า (SectionInstance v1: {type, variant, content, style})
 * → RowInstance v2 — ใช้ตอนอ่านจาก DB เท่านั้น; save ครั้งถัดไปเขียนเป็น v2
 */

interface LegacySection {
  id: string;
  type: string;
  variant: string;
  content: Record<string, unknown>;
  style: {
    background?: string;
    paddingY?: "sm" | "md" | "lg";
    hidden?: boolean;
    columnSplit?: string;
  };
}

export function isLegacySections(data: unknown): data is LegacySection[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    data[0] !== null &&
    "content" in data[0] &&
    !("columns" in data[0])
  );
}

function comp(type: ComponentType, props: Record<string, unknown>): ComponentInstance {
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

export function convertLegacySections(sections: LegacySection[]): RowInstance[] {
  return sections.map((s) => {
    const c = s.content as Record<string, never>;
    const base = {
      background: s.style.background,
      paddingY: s.style.paddingY,
      hidden: s.style.hidden,
    };

    switch (s.type) {
      case "header":
        return makeRow(
          "แถบเมนูด้านบน",
          [
            col(12, [
              comp("navbar", {
                brandName: c["brandName"],
                links: c["links"],
                ctaLabel: c["ctaLabel"],
              }),
            ]),
          ],
          { ...base, paddingY: "none" },
        );

      case "footer":
        return makeRow(
          "ส่วนท้ายเว็บไซต์",
          [
            col(12, [
              comp("siteFooter", {
                brandName: c["brandName"],
                description: c["description"],
                copyright: c["copyright"],
              }),
            ]),
          ],
          { ...base, paddingY: "none" },
        );

      case "hero": {
        const split = (s.style.columnSplit ?? "6-6").split("-").map(Number);
        const left: ComponentInstance[] = [];
        if (c["eyebrow"])
          left.push(comp("text", { text: c["eyebrow"], muted: false, size: "sm" }));
        left.push(comp("heading", { text: c["headline"] ?? "หัวข้อ", level: 1 }));
        if (c["subhead"]) left.push(comp("text", { text: c["subhead"], size: "lg" }));
        const primary = c["primaryCta"] as { label?: string; href?: string } | undefined;
        const secondary = c["secondaryCta"] as { label?: string; href?: string } | undefined;
        if (primary?.label) {
          const buttons = [
            { label: primary.label, href: primary.href ?? "#", variant: "solid" },
          ];
          if (secondary?.label) {
            buttons.push({
              label: secondary.label,
              href: secondary.href ?? "#",
              variant: "outline",
            });
          }
          left.push(comp("button", { buttons }));
        }
        return makeRow(
          "Hero",
          [
            col(split[0] || 6, left, { verticalAlign: "center" }),
            col(split[1] || 6, [comp("image", { url: c["imageUrl"] })]),
          ],
          { ...base, paddingY: s.style.paddingY ?? "lg" },
        );
      }

      case "text": {
        const comps: ComponentInstance[] = [];
        if (c["heading"]) comps.push(comp("heading", { text: c["heading"], level: 2 }));
        comps.push(comp("text", { text: c["body"] ?? "" }));
        return makeRow("ข้อความ", [col(12, comps)], base);
      }

      case "features": {
        const items =
          (c["items"] as Array<{ title: string; description: string }>) ?? [];
        const spans: Record<number, number> = { 1: 12, 2: 6, 3: 4, 4: 3 };
        const span = spans[Math.min(4, Math.max(1, items.length))] ?? 4;
        return makeRow(
          "จุดเด่น",
          items.map((item) =>
            col(
              span,
              [
                comp("heading", { text: item.title, level: 3 }),
                comp("text", { text: item.description }),
              ],
              { card: true },
            ),
          ),
          base,
        );
      }

      case "cta":
        return makeRow(
          "ชวนลงมือทำ",
          [
            col(
              12,
              [
                comp("heading", { text: c["heading"] ?? "", level: 2 }),
                ...(c["subhead"] ? [comp("text", { text: c["subhead"] })] : []),
                comp("button", {
                  buttons: [
                    {
                      label: c["buttonLabel"] ?? "ติดต่อเรา",
                      href: c["buttonHref"] ?? "#",
                      variant: "solid",
                    },
                  ],
                }),
              ],
              { align: "center" },
            ),
          ],
          base,
        );

      default:
        // type ที่ยังไม่เคย implement (placeholder เดิม) → แถวเปล่า 1 คอลัมน์
        return { ...makeBlankRow([12]), label: `แถว (${s.type})`, style: base };
    }
  });
}
