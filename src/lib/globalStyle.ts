import type { GlobalStyle } from "./page/types";

/**
 * แปลง GlobalStyle → inline CSS custom properties
 * ใช้กับ wrapper ของ website (ทั้งใน Builder และ published site)
 * เพื่อให้ทุก Component ที่อ้าง var(--brand-primary) ฯลฯ ปรับตามค่า
 */
export function toCssVariables(style: GlobalStyle): React.CSSProperties {
  const radius = {
    none: "0",
    sm: "0.375rem",
    md: "0.625rem",
    lg: "1rem",
  }[style.radius];

  return {
    ["--brand-primary" as never]: style.primaryColor,
    ["--brand-secondary" as never]: style.secondaryColor,
    ["--radius-md" as never]: radius,
  };
}
