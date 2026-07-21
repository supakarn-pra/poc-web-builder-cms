import { z } from "zod";
import type { FC } from "react";
import type { ComponentType, GlobalStyle, SiteData } from "../types";
import { ContactFormClient } from "./ContactFormClient";
import { GallerySlider } from "./GallerySlider";
import { StatNumber } from "./StatNumber";
import { resolveHref } from "../links";

/**
 * Component registry — ชิ้นส่วนที่วางใน column ได้
 * Render ต้อง server-safe (ไม่มี event handler) เพื่อใช้ทั้ง builder และ public site
 */

export interface ComponentDefinition<P> {
  type: ComponentType;
  label: string;
  schema: z.ZodType<P>;
  defaultProps: () => P;
  Render: FC<{ props: P; global: GlobalStyle; siteData?: SiteData }>;
}

// --- heading ---------------------------------------------------------------

const headingSchema = z.object({
  text: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});
export type HeadingProps = z.infer<typeof headingSchema>;

/** export ให้ inline editor ใน canvas ใช้สไตล์เดียวกับของจริง */
export const headingClass: Record<HeadingProps["level"], string> = {
  1: "font-display text-4xl @3xl:text-5xl font-semibold leading-tight",
  2: "font-display text-3xl font-semibold",
  3: "font-display text-xl font-semibold",
};

const headingDef: ComponentDefinition<HeadingProps> = {
  type: "heading",
  label: "หัวข้อ",
  schema: headingSchema,
  defaultProps: () => ({ text: "หัวข้อของคุณ", level: 2 }),
  Render: ({ props }) => {
    const Tag = (`h${props.level}`) as "h1" | "h2" | "h3";
    return <Tag className={headingClass[props.level]}>{props.text}</Tag>;
  },
};

// --- text --------------------------------------------------------------------

const textSchema = z.object({
  text: z.string(),
  muted: z.boolean().optional(),
  size: z.enum(["sm", "md", "lg"]).optional(),
});
export type TextProps = z.infer<typeof textSchema>;

/** export ให้ inline editor ใน canvas ใช้สไตล์เดียวกับของจริง */
export function textClass(props: TextProps): string {
  return [
    "whitespace-pre-line leading-relaxed",
    props.muted !== false ? "text-text-muted" : "text-text",
    props.size === "sm" ? "text-sm" : props.size === "lg" ? "text-lg" : "",
  ].join(" ");
}

const textDef: ComponentDefinition<TextProps> = {
  type: "text",
  label: "ข้อความ",
  schema: textSchema,
  defaultProps: () => ({
    text: "พิมพ์ข้อความของคุณที่นี่ ดับเบิลคลิกเพื่อแก้ได้ทันที",
    muted: true,
  }),
  Render: ({ props }) => <p className={textClass(props)}>{props.text}</p>,
};

// --- button ------------------------------------------------------------------

const buttonItemSchema = z.object({
  label: z.string(),
  href: z.string(),
  variant: z.enum(["solid", "outline"]).optional(),
});
export type ButtonItem = z.infer<typeof buttonItemSchema>;

const buttonSchema = z.object({
  /** "inherit" = ตามการจัดวางของคอลัมน์ */
  align: z.enum(["inherit", "left", "center", "right"]).optional(),
  buttons: z.array(buttonItemSchema).min(1).max(3),
});
export type ButtonProps = z.infer<typeof buttonSchema>;

export const MAX_BUTTONS = 3;

/** รองรับข้อมูลรุ่นเก่า {label, href, secondaryLabel?, secondaryHref?} */
export function normalizeButtonProps(raw: Record<string, unknown>): ButtonProps {
  if (Array.isArray(raw.buttons)) {
    return {
      align: (raw.align as ButtonProps["align"]) ?? "inherit",
      buttons: (raw.buttons as ButtonItem[]).slice(0, MAX_BUTTONS),
    };
  }
  const buttons: ButtonItem[] = [
    {
      label: (raw.label as string) ?? "ปุ่ม",
      href: (raw.href as string) ?? "#",
      variant: "solid",
    },
  ];
  if (raw.secondaryLabel) {
    buttons.push({
      label: raw.secondaryLabel as string,
      href: (raw.secondaryHref as string) ?? "#",
      variant: "outline",
    });
  }
  return { align: "inherit", buttons };
}

const buttonAlignClass = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

const buttonVariantClass = {
  solid:
    "bg-[color:var(--brand-primary)] text-white shadow-sm hover:bg-[color:var(--brand-primary-hover)]",
  outline: "border border-border-strong hover:bg-surface-hover",
};

const buttonDef: ComponentDefinition<ButtonProps> = {
  type: "button",
  label: "ปุ่ม",
  schema: buttonSchema,
  defaultProps: () => ({
    align: "inherit",
    buttons: [{ label: "เริ่มใช้งาน", href: "#", variant: "solid" }],
  }),
  Render: ({ props, siteData }) => {
    const p = normalizeButtonProps(props as Record<string, unknown>);
    const align = p.align ?? "inherit";
    return (
      <div
        className={[
          "flex flex-wrap gap-3",
          // inherit = รับ justify จากคอลัมน์ผ่าน .comp-flex; ระบุเอง = override
          align === "inherit" ? "comp-flex" : buttonAlignClass[align],
        ].join(" ")}
      >
        {p.buttons.map((b, i) => (
          <a
            key={i}
            href={resolveHref(b.href, siteData)}
            className={`inline-flex items-center rounded-md px-5 py-2.5 ${buttonVariantClass[b.variant ?? "solid"]}`}
          >
            {b.label}
          </a>
        ))}
      </div>
    );
  },
};

// --- image ---------------------------------------------------------------------

const imageSchema = z.object({
  url: z.string().optional(),
  alt: z.string().optional(),
  aspect: z.enum(["video", "classic", "square", "auto"]).optional(),
});
export type ImageProps = z.infer<typeof imageSchema>;

const aspectClass = {
  video: "aspect-video",
  classic: "aspect-[4/3]",
  square: "aspect-square",
  auto: "",
};

const imageDef: ComponentDefinition<ImageProps> = {
  type: "image",
  label: "รูปภาพ",
  schema: imageSchema,
  defaultProps: () => ({ aspect: "classic" }),
  Render: ({ props }) => {
    const aspect = aspectClass[props.aspect ?? "classic"];
    return props.url ? (
      <div className={`overflow-hidden rounded-lg bg-surface-muted ${aspect}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={props.url}
          alt={props.alt ?? ""}
          className="h-full w-full object-cover"
        />
      </div>
    ) : (
      <div
        className={`flex items-center justify-center rounded-lg bg-surface-muted text-sm text-text-subtle ${aspect || "py-16"}`}
      >
        เพิ่มรูปตรงนี้
      </div>
    );
  },
};

// --- video ---------------------------------------------------------------------

const videoSchema = z.object({
  url: z.string().optional(),
});
export type VideoProps = z.infer<typeof videoSchema>;

/** แปลงลิงก์ YouTube/Vimeo ธรรมดา → embed URL */
export function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

const videoDef: ComponentDefinition<VideoProps> = {
  type: "video",
  label: "วิดีโอ",
  schema: videoSchema,
  defaultProps: () => ({}),
  Render: ({ props }) =>
    props.url ? (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={toEmbedUrl(props.url)}
          title="วิดีโอ"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    ) : (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-surface-muted text-sm text-text-subtle">
        วางลิงก์ YouTube หรือ Vimeo ในแผงขวา
      </div>
    ),
};

// --- gallery ---------------------------------------------------------------------

const gallerySchema = z.object({
  images: z.array(z.string()),
  mode: z.enum(["grid", "slider"]).optional(),
  cols: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
});
export type GalleryProps = z.infer<typeof gallerySchema>;

const galleryColsClass = { 2: "grid-cols-2", 3: "grid-cols-2 @3xl:grid-cols-3", 4: "grid-cols-2 @3xl:grid-cols-4" };

const galleryDef: ComponentDefinition<GalleryProps> = {
  type: "gallery",
  label: "แกลเลอรี่รูป",
  schema: gallerySchema,
  defaultProps: () => ({ images: [], mode: "grid", cols: 3 }),
  Render: ({ props }) => {
    if (props.mode === "slider") {
      return <GallerySlider images={props.images} />;
    }
    const cols = galleryColsClass[props.cols ?? 3];
    const images = props.images.length > 0 ? props.images : [null, null, null];
    return (
      <div className={`grid gap-3 ${cols}`}>
        {images.map((url, i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface-muted text-xs text-text-subtle"
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <>รูปที่ {i + 1}</>
            )}
          </div>
        ))}
      </div>
    );
  },
};

// --- quote (รีวิว/คำรับรอง) ---------------------------------------------------------

const quoteSchema = z.object({
  text: z.string(),
  author: z.string().optional(),
  role: z.string().optional(),
});
export type QuoteProps = z.infer<typeof quoteSchema>;

const quoteDef: ComponentDefinition<QuoteProps> = {
  type: "quote",
  label: "รีวิว/คำพูด",
  schema: quoteSchema,
  defaultProps: () => ({
    text: "บริการดีมาก ประทับใจตั้งแต่ครั้งแรกที่ใช้",
    author: "ชื่อลูกค้า",
    role: "ตำแหน่ง/บริษัท",
  }),
  Render: ({ props }) => (
    <figure className="space-y-3">
      <div className="text-3xl leading-none text-[color:var(--brand-primary)]">
        &ldquo;
      </div>
      <blockquote className="text-text">{props.text}</blockquote>
      {props.author ? (
        <figcaption className="text-sm">
          <span className="font-medium">{props.author}</span>
          {props.role ? (
            <span className="text-text-subtle"> · {props.role}</span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  ),
};

// --- stat (ตัวเลข/สถิติ) --------------------------------------------------------------

const statSchema = z.object({
  /** ตัวเลขล้วน — แยกจากหน่วยเพื่อทำแอนิเมชั่นนับ 0→ค่า */
  value: z.number(),
  prefix: z.string().optional(), // เช่น "฿"
  suffix: z.string().optional(), // เช่น "+", "%", " ปี"
  label: z.string(),
  animate: z.boolean().optional(), // default true
});
export type StatProps = z.infer<typeof statSchema>;

/** รองรับข้อมูลรุ่นเก่า {value: "100+"} → แยกตัวเลข/หน่วย */
export function normalizeStatProps(raw: Record<string, unknown>): StatProps {
  if (typeof raw.value === "number") {
    return raw as unknown as StatProps;
  }
  const str = String(raw.value ?? "0");
  const m = str.match(/^([^\d-]*)(-?[\d,.]+)(.*)$/);
  const num = m ? Number(m[2].replace(/,/g, "")) : 0;
  return {
    value: Number.isFinite(num) ? num : 0,
    prefix: m?.[1] || undefined,
    suffix: m?.[3] || undefined,
    label: (raw.label as string) ?? "",
    animate: raw.animate as boolean | undefined,
  };
}

const statDef: ComponentDefinition<StatProps> = {
  type: "stat",
  label: "ตัวเลขสถิติ",
  schema: statSchema,
  defaultProps: () => ({
    value: 100,
    suffix: "+",
    label: "ลูกค้าที่ไว้วางใจ",
    animate: true,
  }),
  Render: ({ props }) => {
    const p = normalizeStatProps(props as Record<string, unknown>);
    return (
      <div>
        <StatNumber
          value={p.value}
          prefix={p.prefix}
          suffix={p.suffix}
          animate={p.animate}
        />
        <p className="mt-1 text-sm text-text-muted">{p.label}</p>
      </div>
    );
  },
};

// --- faq -----------------------------------------------------------------------------

const faqSchema = z.object({
  items: z.array(z.object({ question: z.string(), answer: z.string() })),
});
export type FaqProps = z.infer<typeof faqSchema>;

const faqDef: ComponentDefinition<FaqProps> = {
  type: "faq",
  label: "คำถามที่พบบ่อย",
  schema: faqSchema,
  defaultProps: () => ({
    items: [
      { question: "คำถามที่ 1?", answer: "คำตอบสั้น ๆ เข้าใจง่าย" },
      { question: "คำถามที่ 2?", answer: "คำตอบสั้น ๆ เข้าใจง่าย" },
    ],
  }),
  // ใช้ <details> — เปิด/ปิดได้โดยไม่ต้องมี JS (server-safe)
  Render: ({ props }) => (
    <div className="divide-y divide-border rounded-lg border border-border bg-surface">
      {props.items.map((item, i) => (
        <details key={i} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
            {item.question}
            <span className="text-text-subtle transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <p className="pt-2 text-sm text-text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  ),
};

// --- divider / spacer -------------------------------------------------------------------

const dividerDef: ComponentDefinition<Record<string, never>> = {
  type: "divider",
  label: "เส้นคั่น",
  schema: z.object({}),
  defaultProps: () => ({}),
  Render: () => <hr className="border-border" />,
};

const spacerSchema = z.object({
  size: z.enum(["sm", "md", "lg"]).optional(),
});
export type SpacerProps = z.infer<typeof spacerSchema>;

const spacerHeight = { sm: "h-6", md: "h-12", lg: "h-20" };

const spacerDef: ComponentDefinition<SpacerProps> = {
  type: "spacer",
  label: "ระยะเว้น",
  schema: spacerSchema,
  defaultProps: () => ({ size: "md" }),
  Render: ({ props }) => (
    <div aria-hidden className={spacerHeight[props.size ?? "md"]} />
  ),
};

// --- contactForm ---------------------------------------------------------------------------

const contactFormSchema = z.object({
  buttonLabel: z.string(),
});
export type ContactFormProps = z.infer<typeof contactFormSchema>;

const contactFormDef: ComponentDefinition<ContactFormProps> = {
  type: "contactForm",
  label: "แบบฟอร์มติดต่อ",
  schema: contactFormSchema,
  defaultProps: () => ({ buttonLabel: "ส่งข้อความ" }),
  // ส่งจริงเข้ากล่องข้อความ (ดูได้ที่ภาพรวมใน CMS); ใน canvas โดน pointer-events กันไว้
  Render: ({ props, siteData }) => (
    <ContactFormClient
      websiteId={siteData?.websiteId}
      buttonLabel={props.buttonLabel}
    />
  ),
};

// --- blogList ---------------------------------------------------------------------

const blogListSchema = z.object({
  limit: z.number().int().min(1).max(24).optional(),
});
export type BlogListProps = z.infer<typeof blogListSchema>;

const blogListDef: ComponentDefinition<BlogListProps> = {
  type: "blogList",
  label: "รายการบทความ",
  schema: blogListSchema,
  defaultProps: () => ({ limit: 6 }),
  Render: ({ props, siteData }) => {
    const posts = (siteData?.posts ?? []).slice(0, props.limit ?? 6);
    if (posts.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-border-strong p-10 text-center text-sm text-text-muted">
          ยังไม่มีบทความที่เผยแพร่ — เขียนได้ที่เมนู &quot;บทความ&quot;
        </div>
      );
    }
    return (
      <div className="grid gap-6 grid-cols-1 @3xl:grid-cols-3">
        {posts.map((post, i) => (
          <a
            key={`${post.slug}-${i}`}
            href={`${siteData?.blogBasePath ?? ""}/${post.slug}`}
            className="group overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-[var(--shadow-md)]"
          >
            <div className="aspect-[16/9] overflow-hidden bg-surface-muted">
              {post.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.coverImageUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-text-subtle">
                  ไม่มีภาพปก
                </div>
              )}
            </div>
            <div className="space-y-1.5 p-4">
              <p className="text-[11px] text-text-subtle">
                {post.categoryName ? `${post.categoryName} · ` : ""}
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("th-TH", {
                      dateStyle: "medium",
                    })
                  : ""}
              </p>
              <h3 className="font-display font-semibold leading-snug group-hover:text-[color:var(--brand-primary)]">
                {post.title}
              </h3>
              {post.excerpt ? (
                <p className="line-clamp-2 text-sm text-text-muted">
                  {post.excerpt}
                </p>
              ) : null}
            </div>
          </a>
        ))}
      </div>
    );
  },
};

// --- navbar ---------------------------------------------------------------------

const navbarSchema = z.object({
  brandName: z.string(),
  links: z.array(z.object({ label: z.string(), href: z.string() })),
  ctaLabel: z.string().optional(),
});
export type NavbarProps = z.infer<typeof navbarSchema>;

const navbarDef: ComponentDefinition<NavbarProps> = {
  type: "navbar",
  label: "แถบเมนู",
  schema: navbarSchema,
  defaultProps: () => ({
    brandName: "ชื่อแบรนด์ของคุณ",
    links: [
      { label: "หน้าแรก", href: "#" },
      { label: "เกี่ยวกับเรา", href: "#" },
      { label: "ติดต่อ", href: "#" },
    ],
  }),
  Render: ({ props, siteData }) => (
    <div className="flex h-16 items-center justify-between">
      <span className="font-display text-lg font-semibold">
        {props.brandName}
      </span>
      <nav className="hidden @3xl:flex items-center gap-6 text-sm">
        {props.links.map((l) => (
          <a
            key={l.label}
            href={resolveHref(l.href, siteData)}
            className="hover:text-[color:var(--brand-primary)]"
          >
            {l.label}
          </a>
        ))}
      </nav>
      {props.ctaLabel ? (
        <a
          href="#"
          className="inline-flex items-center rounded-md bg-[color:var(--brand-primary)] px-4 py-2 text-sm text-white"
        >
          {props.ctaLabel}
        </a>
      ) : null}
    </div>
  ),
};

// --- siteFooter -------------------------------------------------------------------

const siteFooterSchema = z.object({
  brandName: z.string(),
  description: z.string().optional(),
  copyright: z.string().optional(),
  // เมนูส่วนท้าย — จัดการได้ที่หน้า "เมนูเว็บไซต์" ใน CMS
  links: z
    .array(z.object({ label: z.string(), href: z.string() }))
    .optional(),
});
export type SiteFooterProps = z.infer<typeof siteFooterSchema>;

const siteFooterDef: ComponentDefinition<SiteFooterProps> = {
  type: "siteFooter",
  label: "ส่วนท้าย",
  schema: siteFooterSchema,
  defaultProps: () => ({
    brandName: "ชื่อแบรนด์ของคุณ",
    description: "คำอธิบายสั้น ๆ เกี่ยวกับธุรกิจหรือเว็บไซต์ของคุณ",
  }),
  Render: ({ props, siteData }) => (
    <div className="space-y-3 py-10">
      <p className="font-display font-semibold">{props.brandName}</p>
      {props.description ? (
        <p className="max-w-md text-sm text-text-muted">{props.description}</p>
      ) : null}
      {props.links?.length ? (
        <nav className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-sm">
          {props.links.map((l, i) => (
            <a
              key={`${l.label}-${i}`}
              href={resolveHref(l.href, siteData)}
              className="text-text-muted hover:text-[color:var(--brand-primary)]"
            >
              {l.label}
            </a>
          ))}
        </nav>
      ) : null}
      <p className="pt-4 text-xs text-text-subtle">
        {props.copyright ?? `© ${props.brandName}`}
      </p>
    </div>
  ),
};

// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentRegistry: Record<ComponentType, ComponentDefinition<any>> = {
  heading: headingDef,
  text: textDef,
  button: buttonDef,
  image: imageDef,
  video: videoDef,
  gallery: galleryDef,
  quote: quoteDef,
  stat: statDef,
  faq: faqDef,
  divider: dividerDef,
  spacer: spacerDef,
  contactForm: contactFormDef,
  blogList: blogListDef,
  navbar: navbarDef,
  siteFooter: siteFooterDef,
};

/** component ที่ผู้ใช้เพิ่มเองได้จากปุ่ม + ในคอลัมน์ (navbar/footer มากับ preset เท่านั้น) */
export const userAddableComponents: ComponentType[] = [
  "heading",
  "text",
  "button",
  "image",
  "video",
  "gallery",
  "quote",
  "stat",
  "faq",
  "contactForm",
  "blogList",
  "divider",
  "spacer",
];
