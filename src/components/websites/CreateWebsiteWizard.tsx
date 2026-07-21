"use client";

import { useActionState, useState } from "react";
import { Check, Layout, Building2, Newspaper } from "lucide-react";
import {
  createWebsite,
  type CreateWebsiteState,
} from "@/server/actions/website";
import { siteTemplates, type SiteType } from "@/lib/templates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

const icons: Record<SiteType, typeof Layout> = {
  LANDING: Layout,
  COMPANY: Building2,
  BLOG: Newspaper,
};

export function CreateWebsiteWizard() {
  const [step, setStep] = useState<1 | 2>(1);
  const [siteType, setSiteType] = useState<SiteType | null>(null);
  const [name, setName] = useState("");

  const [state, action, pending] = useActionState<CreateWebsiteState, FormData>(
    createWebsite,
    {},
  );

  const selectedTemplate = siteTemplates.find((t) => t.siteType === siteType);

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Step indicator */}
      <ol className="mb-8 flex items-center justify-center gap-3 text-sm">
        {["เลือกประเภทเว็บไซต์", "ตั้งชื่อเวอร์ชัน"].map((label, i) => {
          const n = (i + 1) as 1 | 2;
          const active = step === n;
          const done = step > n;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold",
                  active &&
                    "border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-white",
                  done &&
                    "border-[color:var(--brand-primary)] text-[color:var(--brand-primary)]",
                  !active && !done && "border-border text-text-subtle",
                )}
              >
                {done ? <Check size={13} /> : n}
              </span>
              <span className={cn(active ? "font-medium" : "text-text-muted")}>
                {label}
              </span>
              {i === 0 ? <span className="mx-2 h-px w-8 bg-border" /> : null}
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {siteTemplates.map((tpl) => {
              const Icon = icons[tpl.siteType];
              const selected = siteType === tpl.siteType;
              return (
                <button
                  key={tpl.siteType}
                  type="button"
                  onClick={() => setSiteType(tpl.siteType)}
                  className={cn(
                    "rounded-lg border-2 bg-surface p-5 text-left transition-colors hover:border-[color:var(--brand-primary)]/50",
                    selected
                      ? "border-[color:var(--brand-primary)]"
                      : "border-border",
                  )}
                >
                  <div
                    className={cn(
                      "mb-3 grid h-10 w-10 place-items-center rounded-md",
                      selected
                        ? "bg-[color:var(--brand-primary)] text-white"
                        : "bg-surface-muted text-text-muted",
                    )}
                  >
                    <Icon size={19} />
                  </div>
                  <p className="font-medium">{tpl.label}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {tpl.description}
                  </p>
                  <p className="mt-2 text-[11px] text-text-subtle">
                    {tpl.pages.length} หน้า
                  </p>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button
              size="lg"
              disabled={!siteType}
              onClick={() => setStep(2)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      ) : (
        <form action={action} className="space-y-5">
          <input type="hidden" name="siteType" value={siteType ?? ""} />
          <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
            <Input
              name="name"
              label="ชื่อเวอร์ชัน"
              placeholder="เช่น เว็บหลัก, ปรับดีไซน์ใหม่, โปรปีใหม่"
              value={name}
              onChange={(e) => setName(e.target.value)}
              hint="ใช้แยกเวอร์ชันในระบบจัดการ — คนเข้าเว็บไม่เห็นชื่อนี้"
              required
            />
            {selectedTemplate ? (
              <p className="text-xs text-text-subtle">
                Template: {selectedTemplate.label} · ระบบจะสร้างหน้าเว็บให้:{" "}
                {selectedTemplate.pages.map((p) => p.name).join(", ")}
              </p>
            ) : null}
          </div>

          {state.error ? (
            <p className="text-sm text-danger">{state.error}</p>
          ) : null}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              disabled={pending}
            >
              ย้อนกลับ
            </Button>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "กำลังสร้างเวอร์ชัน…" : "สร้างเวอร์ชัน"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
