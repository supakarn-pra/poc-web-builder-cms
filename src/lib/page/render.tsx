import { cn } from "@/lib/cn";
import { componentRegistry } from "./components/registry";
import type {
  ColumnInstance,
  ComponentInstance,
  GlobalStyle,
  RowInstance,
  RowStyle,
  SiteData,
} from "./types";

/**
 * ตัว render กลาง — ใช้ทั้ง public site และ builder canvas
 * ใช้ container query (@3xl = 768px ของ container) แทน media query
 * เพื่อให้ device preview ใน builder ตรงกับหน้าจอจริง
 *
 * ห้าม template class string — enumerate เพื่อให้ Tailwind เก็บตอน build
 */

export const rowPaddingClass: Record<NonNullable<RowStyle["paddingY"]>, string> = {
  none: "py-0",
  sm: "py-8",
  md: "py-14",
  lg: "py-24",
};

export const contentWidthClass: Record<
  NonNullable<RowStyle["contentWidth"]>,
  string
> = {
  normal: "max-w-6xl",
  wide: "max-w-7xl",
  full: "max-w-none",
};

export const colSpanClass: Record<number, string> = {
  1: "@3xl:col-span-1",
  2: "@3xl:col-span-2",
  3: "@3xl:col-span-3",
  4: "@3xl:col-span-4",
  5: "@3xl:col-span-5",
  6: "@3xl:col-span-6",
  7: "@3xl:col-span-7",
  8: "@3xl:col-span-8",
  9: "@3xl:col-span-9",
  10: "@3xl:col-span-10",
  11: "@3xl:col-span-11",
  12: "@3xl:col-span-12",
};

// จัดแนวนอน: ใช้ text-align + สั่ง flex-row ภายใน component (.comp-flex เช่นแถวปุ่ม)
// ห้ามใช้ items-* — จะทำให้ block ลูกหดตามเนื้อหาแทนที่จะเต็มคอลัมน์
const alignClass = {
  left: "text-left [&_.comp-flex]:justify-start",
  center: "text-center [&_.comp-flex]:justify-center",
  right: "text-right [&_.comp-flex]:justify-end",
};

const vAlignClass = {
  top: "justify-start",
  center: "justify-center",
  bottom: "justify-end",
};

export function ComponentView({
  component,
  global,
  siteData,
}: {
  component: ComponentInstance;
  global: GlobalStyle;
  siteData?: SiteData;
}) {
  const def = componentRegistry[component.type];
  if (!def) return null;
  const Render = def.Render;
  return <Render props={component.props} global={global} siteData={siteData} />;
}

export function columnClasses(col: ColumnInstance) {
  return cn(
    "col-span-12 flex min-w-0 flex-col gap-4",
    colSpanClass[Math.min(12, Math.max(1, col.span))],
    alignClass[col.style?.align ?? "left"],
    vAlignClass[col.style?.verticalAlign ?? "top"],
    col.style?.card &&
      "rounded-lg border border-border bg-surface p-6",
  );
}

export function rowClasses(row: RowInstance) {
  return rowPaddingClass[row.style.paddingY ?? "md"];
}

export function rowInnerClasses(row: RowInstance) {
  return cn(
    "mx-auto grid w-full grid-cols-12 gap-x-6 gap-y-8 px-4 @3xl:px-6",
    contentWidthClass[row.style.contentWidth ?? "normal"],
  );
}

/** Render แถวแบบ read-only — ใช้ในหน้าเว็บจริง (/sites) */
export function RowView({
  row,
  global,
  siteData,
}: {
  row: RowInstance;
  global: GlobalStyle;
  siteData?: SiteData;
}) {
  if (row.style.hidden) return null;
  return (
    <section
      className={rowClasses(row)}
      style={{ background: row.style.background }}
    >
      <div className={rowInnerClasses(row)}>
        {row.columns.map((col) => (
          <div key={col.id} className={columnClasses(col)}>
            {col.components.map((component) => (
              <ComponentView
                key={component.id}
                component={component}
                global={global}
                siteData={siteData}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Wrapper ของทั้งหน้า — ต้องมี @container เพื่อให้ @3xl: ทำงาน */
export function PageRows({
  rows,
  global,
  siteData,
}: {
  rows: RowInstance[];
  global: GlobalStyle;
  siteData?: SiteData;
}) {
  return (
    <div className="@container">
      {rows.map((row) => (
        <RowView key={row.id} row={row} global={global} siteData={siteData} />
      ))}
    </div>
  );
}
