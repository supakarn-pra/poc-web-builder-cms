"use client";

import { useActionState } from "react";
import {
  updateCustomDomain,
  type DomainState,
} from "@/server/actions/website";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CustomDomainForm({
  websiteId,
  customDomain,
}: {
  websiteId: string;
  customDomain: string | null;
}) {
  const [state, action, pending] = useActionState<DomainState, FormData>(
    updateCustomDomain,
    {},
  );

  return (
    <div className="max-w-xl space-y-3 rounded-lg border border-border bg-surface p-6">
      <div>
        <h2 className="font-medium">โดเมนของคุณเอง</h2>
        <p className="mt-0.5 text-xs text-text-muted">
          เว็บสาธารณะเสิร์ฟที่หน้าแรกของเซิร์ฟเวอร์นี้อยู่แล้ว —
          แค่ชี้โดเมนมาที่เซิร์ฟเวอร์ก็ใช้งานได้
        </p>
      </div>

      <form action={action} className="flex items-end gap-2">
        <input type="hidden" name="websiteId" value={websiteId} />
        <div className="flex-1">
          <Input
            name="customDomain"
            label="โดเมน"
            defaultValue={customDomain ?? ""}
            placeholder="เช่น mybrand.com"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
      </form>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.saved ? <p className="text-sm text-success">บันทึกแล้ว</p> : null}

      <div className="rounded-md bg-surface-muted p-4 text-xs leading-relaxed text-text-muted">
        <p className="font-medium text-text">วิธีชี้โดเมนมาที่เว็บนี้ (ตั้งที่ผู้ให้บริการโดเมน)</p>
        <ol className="mt-1.5 list-decimal space-y-1 pl-4">
          <li>
            เพิ่ม <span className="font-mono">A record</span>: host{" "}
            <span className="font-mono">@</span> → IP ของเซิร์ฟเวอร์ที่ deploy เว็บนี้
          </li>
          <li>
            (ถ้าต้องการ www) เพิ่ม <span className="font-mono">CNAME</span>:{" "}
            <span className="font-mono">www</span> → โดเมนหลักของคุณ
          </li>
          <li>รอ DNS อัปเดต (ปกติไม่กี่นาที ถึง 1 ชั่วโมง) แล้วเปิดโดเมนดูได้เลย</li>
        </ol>
        <p className="mt-2">
          แนะนำใช้ Cloudflare หรือ Caddy ด้านหน้าเพื่อได้ HTTPS อัตโนมัติ —
          ดูรายละเอียดใน DEPLOY.md
        </p>
      </div>
    </div>
  );
}
