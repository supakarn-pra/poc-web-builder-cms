"use client";

import { useEffect, useRef } from "react";

const DURATION_MS = 1200;

/**
 * ตัวเลขนับ 0 → ค่าจริง เมื่อ scroll มาเห็น
 * - SSR แสดงค่าจริงทันที (SEO/no-JS ได้ค่าถูก) แล้วค่อยเริ่มนับตอน client เห็น
 * - เขียน textContent ตรง ๆ ผ่าน rAF — ไม่ re-render React ทุก frame
 * - เคารพ prefers-reduced-motion
 */
export function StatNumber({
  value,
  prefix,
  suffix,
  animate,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  animate?: boolean;
}) {
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (animate === false) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = numRef.current;
    if (!el) return;

    let raf = 0;
    const format = (n: number) => n.toLocaleString("th-TH");
    el.textContent = format(0);

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION_MS);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
          el.textContent = format(Math.round(value * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, animate]);

  return (
    <p className="font-display text-4xl font-semibold text-[color:var(--brand-primary)] tabular-nums">
      {prefix}
      <span ref={numRef}>{value.toLocaleString("th-TH")}</span>
      {suffix}
    </p>
  );
}
