"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** สไลด์ภาพ — scroll-snap + ปุ่มเลื่อนซ้าย/ขวา (ปัด/ลากบนมือถือได้) */
export function GallerySlider({ images }: { images: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: "smooth" });
  };

  const slides =
    images.length > 0
      ? images
      : // placeholder ตอนยังไม่ใส่รูป
        [null, null, null];

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((url, i) => (
          <div
            key={i}
            className="aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-lg bg-surface-muted @3xl:w-[48%]"
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-text-subtle">
                รูปที่ {i + 1}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="เลื่อนไปรูปก่อนหน้า"
        onClick={(e) => {
          e.stopPropagation();
          scrollBy(-1);
        }}
        className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface/90 text-text shadow-[var(--shadow-sm)] hover:bg-surface"
      >
        <ChevronLeft size={17} />
      </button>
      <button
        type="button"
        aria-label="เลื่อนไปรูปถัดไป"
        onClick={(e) => {
          e.stopPropagation();
          scrollBy(1);
        }}
        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface/90 text-text shadow-[var(--shadow-sm)] hover:bg-surface"
      >
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
