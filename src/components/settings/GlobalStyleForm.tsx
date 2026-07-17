"use client";

import { useActionState } from "react";
import {
  updateGlobalStyle,
  type GlobalStyleState,
} from "@/server/actions/globalStyle";
import type { GlobalStyle } from "@/lib/page/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function ColorField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          name={name}
          defaultValue={defaultValue}
          className="h-10 w-14 rounded-md border border-border p-1"
        />
        <span className="text-xs text-text-subtle">{defaultValue}</span>
      </div>
    </label>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function GlobalStyleForm({
  websiteId,
  websiteName,
  style,
}: {
  websiteId: string;
  websiteName: string;
  style: GlobalStyle;
}) {
  const [state, action, pending] = useActionState<GlobalStyleState, FormData>(
    updateGlobalStyle,
    {},
  );

  return (
    <form action={action} className="max-w-xl space-y-6">
      <input type="hidden" name="websiteId" value={websiteId} />

      <div className="rounded-lg border border-border bg-surface p-6 space-y-5">
        <div>
          <h2 className="font-medium">รูปแบบของ {websiteName}</h2>
          <p className="text-xs text-text-muted mt-0.5">
            ค่าเหล่านี้ใช้กับทุกหน้าของเว็บไซต์โดยอัตโนมัติ
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            name="primaryColor"
            label="สีหลัก"
            defaultValue={style.primaryColor}
          />
          <ColorField
            name="secondaryColor"
            label="สีรอง"
            defaultValue={style.secondaryColor}
          />
        </div>

        <Input
          name="logoUrl"
          label="โลโก้ (URL รูปภาพ)"
          placeholder="https://…"
          defaultValue={style.logoUrl ?? ""}
          hint="อัปโหลดรูปได้ใน Sprint 4 — ตอนนี้ใส่เป็นลิงก์"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="headingFont"
            label="Font หัวข้อ"
            defaultValue={style.headingFont}
            options={[
              { value: "sans", label: "โมเดิร์น (Sans)" },
              { value: "serif", label: "ทางการ (Serif)" },
              { value: "display", label: "โดดเด่น (Display)" },
            ]}
          />
          <SelectField
            name="bodyFont"
            label="Font เนื้อหา"
            defaultValue={style.bodyFont}
            options={[
              { value: "sans", label: "โมเดิร์น (Sans)" },
              { value: "serif", label: "ทางการ (Serif)" },
            ]}
          />
          <SelectField
            name="buttonStyle"
            label="รูปแบบปุ่ม"
            defaultValue={style.buttonStyle}
            options={[
              { value: "solid", label: "ทึบ" },
              { value: "outline", label: "ขอบ" },
              { value: "ghost", label: "โปร่ง" },
            ]}
          />
          <SelectField
            name="radius"
            label="ความโค้งของกล่อง"
            defaultValue={style.radius}
            options={[
              { value: "none", label: "เหลี่ยม" },
              { value: "sm", label: "โค้งเล็กน้อย" },
              { value: "md", label: "โค้งปานกลาง" },
              { value: "lg", label: "โค้งมาก" },
            ]}
          />
        </div>
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.saved ? (
        <p className="text-sm text-success">บันทึกแล้ว — ทุกหน้าใช้ค่าใหม่ทันที</p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </Button>
    </form>
  );
}
