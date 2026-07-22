"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const aspectClass = {
  banner: "aspect-[21/9]",
  wide: "aspect-video",
  classic: "aspect-[4/3]",
};

export type SliderAspect = keyof typeof aspectClass;

/**
 * ภาพสไลด์เต็มความกว้าง (hero banner) — เลื่อนเองอัตโนมัติ + ลูกศร + จุดบอกตำแหน่ง
 * ต่างจาก GallerySlider ตรงที่โชว์ทีละภาพเต็มผืน เหมาะกับแบนเนอร์โปรโมท
 */
export function ImageSliderClient({
  images,
  aspect = "banner",
  autoplay = true,
}: {
  images: string[];
  aspect?: SliderAspect;
  autoplay?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = images.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  // autoplay ทุก 5 วิ — หยุดเมื่อ hover (restart ด้วย key ของ index ล่าสุด)
  useEffect(() => {
    if (!autoplay || count < 2) return;
    timer.current = setInterval(() => {
      setIndex((cur) => (cur + 1) % count);
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [autoplay, count]);

  if (count === 0) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center rounded-lg bg-surface-muted text-sm text-text-subtle",
          aspectClass[aspect],
        )}
      >
        เพิ่มรูปสไลด์ในแผงขวา
      </div>
    );
  }

  return (
    <div className={cn("group relative w-full overflow-hidden", aspectClass[aspect])}>
      {/* แถบภาพเลื่อนด้วย transform — ภาพละเต็มความกว้าง */}
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt=""
            className="h-full w-full shrink-0 object-cover"
            draggable={false}
          />
        ))}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="สไลด์ก่อนหน้า"
            onClick={(e) => {
              e.stopPropagation();
              go(index - 1);
            }}
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white opacity-0 transition-opacity hover:bg-black/50 group-hover:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="สไลด์ถัดไป"
            onClick={(e) => {
              e.stopPropagation();
              go(index + 1);
            }}
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white opacity-0 transition-opacity hover:bg-black/50 group-hover:opacity-100"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`ไปสไลด์ที่ ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  go(i);
                }}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
